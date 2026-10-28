export const QUIZ_TYPES = ['predict', 'locate', 'explain_back'] as const;
export type QuizType = (typeof QUIZ_TYPES)[number];

export const QUIZ_STATUS = ['draft', 'validated', 'retired'] as const;
export type QuizStatus = (typeof QUIZ_STATUS)[number];

export interface QuizItem {
  id: string;
  project_id: string;
  revision: string;
  criterion_ids: string[];
  type: QuizType;
  prompt: string;
  rubric: string[];
  evidence_ids: string[];
  difficulty: 1 | 2 | 3;
  status: 'draft' | 'validated' | 'retired';
}

export interface QuizResponse {
  id: string;
  quiz_id: string;
  actor_id: string;
  response_text: string;
  graded: 'pass' | 'fail' | 'pending';
  graded_by?: string;
  graded_at?: string;
  at: string;
}

export interface RoleBriefSection {
  heading: string;
  body: string;
  evidence_ids: string[];
}

export interface RoleBrief {
  id: string;
  project_id: string;
  revision: string;
  role: string;
  sections: RoleBriefSection[];
  unknowns: string[];
  quiz_ids: string[];
  created_at: string;
}

export const LEARN_ROLES = [
  'founder',
  'engineer',
  'qa',
  'marketing',
  'support',
  'operations',
  'product',
] as const;
export type LearnRole = (typeof LEARN_ROLES)[number];

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

export function isQuizType(v: unknown): v is QuizType {
  return typeof v === 'string' && (QUIZ_TYPES as readonly string[]).includes(v);
}

export function validateQuizItem(v: unknown): { ok: true; value: QuizItem } | { ok: false; errors: string[] } {
  const errors: string[] = [];
  if (!isRecord(v)) return { ok: false, errors: ['quiz must be an object'] };
  if (typeof v['id'] !== 'string' || v['id'].length === 0) errors.push('id required');
  if (typeof v['project_id'] !== 'string' || v['project_id'].length === 0) errors.push('project_id required');
  if (typeof v['revision'] !== 'string' || v['revision'].length === 0) errors.push('revision required');
  if (!Array.isArray(v['criterion_ids']) || v['criterion_ids'].length === 0) errors.push('criterion_ids: nonempty array required');
  if (!isQuizType(v['type'])) errors.push('type: predict|locate|explain_back required');
  if (typeof v['prompt'] !== 'string' || v['prompt'].length === 0) errors.push('prompt required');
  if (!Array.isArray(v['rubric']) || v['rubric'].length === 0) errors.push('rubric: nonempty array required');
  if (!Array.isArray(v['evidence_ids'])) errors.push('evidence_ids: array required');
  if (v['difficulty'] !== 1 && v['difficulty'] !== 2 && v['difficulty'] !== 3) errors.push('difficulty: 1|2|3 required');
  if (v['status'] !== 'draft' && v['status'] !== 'validated' && v['status'] !== 'retired') {
    errors.push('status: draft|validated|retired required');
  }
  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, value: v as unknown as QuizItem };
}

/**
 * Grades a locate answer against evidence pointers. Pass requires the right
 * file and an overlapping line range. Anything else fails — no partial credit,
 * no model judgment.
 */
export function gradeLocate(
  quiz: QuizItem,
  responseText: string,
  evidence: { id: string; path?: string; line_start?: number; line_end?: number }[],
): 'pass' | 'fail' {
  const norm = responseText.toLowerCase();
  const relevant = evidence.filter((e) => quiz.evidence_ids.includes(e.id) && e.path !== undefined);
  if (relevant.length === 0) return 'fail';
  const nums = [...norm.matchAll(/\d+/g)].map((m) => Number(m[0]));
  return relevant.some((e) => {
    const path = e.path as string;
    if (!norm.includes(path.toLowerCase()) && !norm.includes(path.split('/').pop()?.toLowerCase() ?? '')) return false;
    if (nums.length === 0) return true;
    const start = e.line_start ?? 1;
    const end = e.line_end ?? start;
    return nums.some((n) => n >= start - 2 && n <= end + 2);
  })
    ? 'pass'
    : 'fail';
}
