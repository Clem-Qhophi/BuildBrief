/**
 * Adaptive intake engine (BB-030). Pure and deterministic: candidate
 * unknowns in, a ranked first-pass question batch out.
 *
 * Rules, from the master plan:
 * - Never ask what the repository already answers (stack, framework,
 *   tests, manifests). Those candidates are skipped with a reason.
 * - Product facts first, technical choices last with repo-detected
 *   defaults. Ranking does this via answerability x impact.
 * - First pass targets 3-6 questions. A critical unresolved decision may
 *   exceed the budget; the batch says why it is still asking.
 * - "Let BuildBrief decide" is offered only for reversible decisions.
 */
import {
  rankQuestions,
  stableId,
  validateQuestion,
  type ClarificationQuestion,
  type QuestionLayer,
  type QuestionOption,
  type QuestionSource,
} from '@buildbrief/domain';

/** Facts the repository already answers. Set = known, never asked about. */
export interface RepoFacts {
  stack?: string;
  framework?: string;
  packageManager?: string;
  languages?: string[];
  hasTests?: boolean;
  entryPoints?: string[];
}

/** Keys of RepoFacts a candidate is answered by when all are known. */
export type RepoFactKey = keyof RepoFacts;

export interface QuestionCandidate {
  layer: QuestionLayer;
  text: string;
  why_it_matters: string;
  options: QuestionOption[];
  impact: number;
  ambiguity: number;
  answerability: number;
  reversibility_cost: number;
  source?: QuestionSource;
  /** Repo fact keys that answer this candidate when all are known. */
  repoKeys?: RepoFactKey[];
  /** Critical unresolved decisions may exceed the question budget. */
  critical?: boolean;
  allow_custom?: boolean;
  allow_defer?: boolean;
  allow_decide_for_me?: boolean;
}

/** Default first-pass question budget (plan: target 3-6). */
export const FIRST_PASS_BUDGET = 6;

export interface SkippedCandidate {
  text: string;
  reason: string;
}

export interface PlannedBatch {
  asked: ClarificationQuestion[];
  skipped: SkippedCandidate[];
}

function factKnown(v: RepoFacts[RepoFactKey]): boolean {
  if (v === undefined) return false;
  if (typeof v === 'string') return v.length > 0;
  if (typeof v === 'boolean') return true;
  return v.length > 0;
}

/** True when every repo key the candidate names is known. */
export function repoAnsweredBy(candidate: Pick<QuestionCandidate, 'repoKeys'>, facts: RepoFacts): boolean {
  const keys = candidate.repoKeys ?? [];
  return keys.length > 0 && keys.every((k) => factKnown(facts[k]));
}

export interface PlanInput {
  project_id: string;
  candidates: QuestionCandidate[];
  repoFacts: RepoFacts;
  budget?: number;
}

/**
 * Rank candidates, drop repo-answered and invalid ones, and cap the batch.
 * Deterministic: same input always yields the same batch. IDs are stable
 * hashes of project + question text.
 */
export function planQuestions(input: PlanInput): PlannedBatch {
  const budget = input.budget ?? FIRST_PASS_BUDGET;
  const skipped: SkippedCandidate[] = [];
  const built: ClarificationQuestion[] = [];
  for (const c of input.candidates) {
    if (repoAnsweredBy(c, input.repoFacts)) {
      skipped.push({ text: c.text, reason: 'answered by repository facts' });
      continue;
    }
    const reversible = c.reversibility_cost <= 2;
    const question: ClarificationQuestion = {
      id: stableId('question', `${input.project_id}|${c.text}`),
      project_id: input.project_id,
      layer: c.layer,
      text: c.text,
      why_it_matters: c.why_it_matters,
      options: c.options,
      allow_custom: c.allow_custom ?? true,
      allow_defer: c.allow_defer ?? true,
      allow_decide_for_me: c.allow_decide_for_me ?? reversible,
      impact: c.impact,
      ambiguity: c.ambiguity,
      answerability: c.answerability,
      reversibility_cost: c.reversibility_cost,
      source: c.source ?? 'template',
      status: 'asked',
    };
    const checked = validateQuestion(question);
    if (!checked.ok) {
      skipped.push({ text: c.text, reason: `invalid candidate: ${checked.errors.join('; ')}` });
      continue;
    }
    built.push(checked.value);
  }
  const ranked = rankQuestions(built);
  const asked = ranked.slice(0, budget);
  const remainder = ranked.slice(budget);
  for (const q of remainder) {
    const candidate = input.candidates.find((c) => stableId('question', `${input.project_id}|${c.text}`) === q.id);
    if (candidate?.critical === true) {
      asked.push(q);
    } else {
      skipped.push({ text: q.text, reason: 'over question budget' });
    }
  }
  // Ranked order is preserved, including appended critical questions.
  return { asked, skipped };
}
