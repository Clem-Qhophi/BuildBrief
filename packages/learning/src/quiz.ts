import {
  contentHash,
  gradeLocate,
  nowIso,
  stableId,
  validateQuizItem,
  type EvidencePointer,
  type IntentVersion,
  type QuizItem,
  type QuizResponse,
  type QuizType,
} from '@buildbrief/domain';
import { type VerificationReport } from '@buildbrief/verifier';

export interface QuizBuildInput {
  projectId: string;
  intent: IntentVersion;
  report: VerificationReport;
  /** default: one locate + one predict (blueprint P1 demo pair). */
  types?: QuizType[];
}

function short(text: string, n: number): string {
  return text.length <= n ? text : `${text.slice(0, n - 1)}…`;
}

/**
 * Generates quiz items from VERIFIED findings only: a question is born with its
 * rubric (the evidence spans) and dies (retired) when those spans stop resolving.
 * Drafts are never generated from unapproved intent or from findings without
 * path evidence.
 */
export function makeQuiz(input: QuizBuildInput): QuizItem[] {
  const types = input.types ?? ['locate', 'predict'];
  const usable = input.report.results.filter(
    (r) =>
      (r.finding.finding === 'supported' || r.finding.finding === 'partial') &&
      r.evidence.some((e) => e.path !== undefined),
  );
  const out: QuizItem[] = [];
  for (const t of types) {
    const target = usable[out.length % Math.max(1, usable.length)];
    if (target === undefined) break;
    const firstPath = target.evidence.find((e) => e.path !== undefined);
    if (firstPath?.path === undefined) continue;
    const loc = `${firstPath.path}#L${firstPath.line_start ?? 1}-${firstPath.line_end ?? firstPath.line_start ?? 1}`;
    const prompt =
      t === 'locate'
        ? `In which file and line range is "${short(target.criterion.text, 80)}" implemented (revision ${input.report.checked_revision.slice(0, 7)})?`
        : t === 'predict'
          ? `What behavior does the code at ${loc} guarantee for "${short(target.criterion.text, 80)}"? Answer in your own words.`
          : `Explain how ${input.intent.feature_id} satisfies "${short(target.criterion.text, 80)}" and name the files involved.`;
    const rubric =
      t === 'locate'
        ? [loc]
        : [target.finding.rationale, ...target.evidence.map((e) => e.description)];
    const item: QuizItem = {
      id: stableId('quiz', `${input.report.run_id}|${target.criterion.id}|${t}`),
      project_id: input.projectId,
      revision: input.report.checked_revision,
      criterion_ids: [target.criterion.id],
      type: t,
      prompt,
      rubric,
      evidence_ids: target.evidence.map((e) => e.id),
      difficulty: t === 'locate' ? 1 : 2,
      status: 'draft',
    };
    const checked = validateQuizItem(item);
    if (!checked.ok) throw new Error(`generated invalid quiz: ${checked.errors.join('; ')}`);
    out.push(checked.value);
  }
  return out;
}

export interface AnswerInput {
  id?: string;
  quiz: QuizItem;
  actor: string;
  text: string;
  evidence: Pick<EvidencePointer, 'id' | 'path' | 'line_start' | 'line_end'>[];
  at?: string;
}

/**
 * Records an answer. Locate answers are graded mechanically here; predict and
 * explain-back answers stay `pending` until a human grades them — no model
 * judgment, no pseudo-scores.
 */
export function answerQuiz(input: AnswerInput): QuizResponse {
  if (input.quiz.status === 'retired') {
    throw new Error(`quiz ${input.quiz.id} is retired (evidence moved); answer the regenerated question instead`);
  }
  const graded =
    input.quiz.type === 'locate' ? gradeLocate(input.quiz, input.text, input.evidence) : 'pending';
  return {
    id: input.id ?? stableId('qresp', `${input.quiz.id}|${input.actor}|${input.text}`),
    quiz_id: input.quiz.id,
    actor_id: input.actor,
    response_text: input.text,
    graded,
    ...(graded === 'pending' ? {} : { graded_by: 'bb-locate-v1', graded_at: input.at ?? nowIso() }),
    at: input.at ?? nowIso(),
  };
}

/** Human override: the owner (or quiz author) grades or re-grades any response. */
export function gradeResponse(
  response: QuizResponse,
  grade: 'pass' | 'fail',
  by: string,
  at?: string,
): QuizResponse {
  if (by.trim().length === 0) throw new Error('grading requires a human grader identity');
  return { ...response, graded: grade, graded_by: by, graded_at: at ?? nowIso() };
}

/**
 * Re-checks every quiz's evidence against CURRENT file content. A question is
 * retired when any cited span is gone, out of range, or its content changed
 * (snippet hash mismatch) — a moved function must never keep collecting grades
 * against stale lines. Same-revision quizzes cannot be stale.
 */
export function retireStale(
  quizzes: QuizItem[],
  currentRevision: string,
  currentFiles: Map<string, string>,
  evidenceById: Map<string, EvidencePointer>,
): QuizItem[] {
  return quizzes.map((q) => {
    if (q.status === 'retired' || q.revision === currentRevision) return q;
    const stale = q.evidence_ids.some((id) => {
      const e = evidenceById.get(id);
      if (e === undefined || e.path === undefined) return true;
      const text = currentFiles.get(e.path);
      if (text === undefined) return true;
      const lines = text.split('\n');
      const start = e.line_start ?? 1;
      const end = e.line_end ?? start;
      if (end > lines.length) return true;
      if (e.snippet_hash === undefined) return false;
      return contentHash(lines.slice(start - 1, end).join('\n')) !== e.snippet_hash;
    });
    return stale ? { ...q, status: 'retired' as const } : q;
  });
}
