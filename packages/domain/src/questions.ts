/**
 * Adaptive clarification contracts (master plan Phase 1).
 * Questions rank unknowns by impact, ambiguity, answerability and the cost
 * of changing the answer later. The repository already answers some
 * questions (stack, framework, existing tests) — those are never asked.
 */

export const QUESTION_LAYERS = ['product', 'boundary', 'quality', 'technical'] as const;
export type QuestionLayer = (typeof QUESTION_LAYERS)[number];

export const QUESTION_SOURCES = ['repo_fact', 'model', 'template'] as const;
export type QuestionSource = (typeof QUESTION_SOURCES)[number];

export const QUESTION_STATUS = ['asked', 'answered', 'deferred', 'skipped_repo_answered'] as const;
export type QuestionStatus = (typeof QUESTION_STATUS)[number];

export const DECISION_SOURCES = ['user', 'default', 'custom'] as const;
export type DecisionSource = (typeof DECISION_SOURCES)[number];

export interface QuestionOption {
  label: string;
  /** One-line plain-language trade-off shown next to the option. */
  tradeoff: string;
  recommended?: boolean;
}

export interface ClarificationQuestion {
  id: string;
  project_id: string;
  layer: QuestionLayer;
  text: string;
  /** Why answering this changes the build. Shown to the owner. */
  why_it_matters: string;
  options: QuestionOption[];
  allow_custom: boolean;
  allow_defer: boolean;
  /** "Let BuildBrief decide" is offered only for reversible decisions. */
  allow_decide_for_me: boolean;
  /** 1-5 estimates used for ranking. reversibility_cost 1 = trivially reversible. */
  impact: number;
  ambiguity: number;
  answerability: number;
  reversibility_cost: number;
  source: QuestionSource;
  status: QuestionStatus;
}

export interface DecisionRecord {
  question_id: string;
  project_id: string;
  /** Chosen option label, or the owner's custom text. */
  chosen: string;
  source: DecisionSource;
  actor: string;
  at: string;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

function isLayer(v: unknown): v is QuestionLayer {
  return typeof v === 'string' && (QUESTION_LAYERS as readonly string[]).includes(v);
}

function isQuestionSource(v: unknown): v is QuestionSource {
  return typeof v === 'string' && (QUESTION_SOURCES as readonly string[]).includes(v);
}

function isQuestionStatus(v: unknown): v is QuestionStatus {
  return typeof v === 'string' && (QUESTION_STATUS as readonly string[]).includes(v);
}

function isDecisionSource(v: unknown): v is DecisionSource {
  return typeof v === 'string' && (DECISION_SOURCES as readonly string[]).includes(v);
}

function isOneToFive(v: unknown): v is number {
  return typeof v === 'number' && Number.isInteger(v) && v >= 1 && v <= 5;
}

/** Runtime validation for untrusted payloads (MCP/hook/CLI boundaries). */
export function validateQuestion(v: unknown): { ok: true; value: ClarificationQuestion } | { ok: false; errors: string[] } {
  const errors: string[] = [];
  if (!isRecord(v)) return { ok: false, errors: ['question must be an object'] };
  if (typeof v['id'] !== 'string' || v['id'].length === 0) errors.push('id: nonempty string required');
  if (typeof v['project_id'] !== 'string' || v['project_id'].length === 0) errors.push('project_id: nonempty string required');
  if (!isLayer(v['layer'])) errors.push('layer: product|boundary|quality|technical required');
  if (typeof v['text'] !== 'string' || v['text'].length === 0) errors.push('text: nonempty string required');
  if (typeof v['why_it_matters'] !== 'string' || v['why_it_matters'].length === 0) errors.push('why_it_matters: nonempty string required');
  if (!Array.isArray(v['options']) || v['options'].length === 0) errors.push('options: nonempty array required');
  else {
    (v['options'] as unknown[]).forEach((o, i) => {
      if (!isRecord(o) || typeof o['label'] !== 'string' || o['label'].length === 0 || typeof o['tradeoff'] !== 'string' || o['tradeoff'].length === 0) {
        errors.push(`options[${i}]: {label, tradeoff} required`);
      }
    });
  }
  if (typeof v['allow_custom'] !== 'boolean') errors.push('allow_custom: boolean required');
  if (typeof v['allow_defer'] !== 'boolean') errors.push('allow_defer: boolean required');
  if (typeof v['allow_decide_for_me'] !== 'boolean') errors.push('allow_decide_for_me: boolean required');
  if (!isOneToFive(v['impact'])) errors.push('impact: integer 1-5 required');
  if (!isOneToFive(v['ambiguity'])) errors.push('ambiguity: integer 1-5 required');
  if (!isOneToFive(v['answerability'])) errors.push('answerability: integer 1-5 required');
  if (!isOneToFive(v['reversibility_cost'])) errors.push('reversibility_cost: integer 1-5 required');
  if (!isQuestionSource(v['source'])) errors.push('source: repo_fact|model|template required');
  if (!isQuestionStatus(v['status'])) errors.push('status: asked|answered|deferred|skipped_repo_answered required');
  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, value: v as unknown as ClarificationQuestion };
}

/** A decision is a named human act, never an agent inference. */
export function validateDecision(v: unknown): { ok: true; value: DecisionRecord } | { ok: false; errors: string[] } {
  const errors: string[] = [];
  if (!isRecord(v)) return { ok: false, errors: ['decision must be an object'] };
  if (typeof v['question_id'] !== 'string' || v['question_id'].length === 0) errors.push('question_id: nonempty string required');
  if (typeof v['project_id'] !== 'string' || v['project_id'].length === 0) errors.push('project_id: nonempty string required');
  if (typeof v['chosen'] !== 'string' || v['chosen'].length === 0) errors.push('chosen: nonempty string required');
  if (!isDecisionSource(v['source'])) errors.push('source: user|default|custom required');
  if (typeof v['actor'] !== 'string' || v['actor'].trim().length === 0) errors.push('actor: nonempty string required (never agent-inferred)');
  if (typeof v['at'] !== 'string' || Number.isNaN(Date.parse(v['at']))) errors.push('at: ISO timestamp required');
  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, value: v as unknown as DecisionRecord };
}

/**
 * Ranking score: impact x ambiguity x answerability x (1 / reversibility_cost).
 * Dependencies and irreversible choices are asked first because they are
 * expensive to change later. Pure and deterministic.
 */
export function questionScore(q: Pick<ClarificationQuestion, 'impact' | 'ambiguity' | 'answerability' | 'reversibility_cost'>): number {
  return (q.impact * q.ambiguity * q.answerability) / q.reversibility_cost;
}

/** Highest-value question first. Stable: ties keep input order. */
export function rankQuestions(questions: ClarificationQuestion[]): ClarificationQuestion[] {
  return [...questions]
    .map((q, i) => ({ q, i }))
    .sort((a, b) => questionScore(b.q) - questionScore(a.q) || a.i - b.i)
    .map((e) => e.q);
}
