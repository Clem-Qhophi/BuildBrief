import type { MapCell } from '@buildbrief/learning';

export interface CellSummary {
  total: number;
  demonstrated: number;
  struggling: number;
  /** Cells in any other state (pending, untested, stale, unmeasured). */
  other: number;
  pass: number;
  fail: number;
  pending: number;
}

/** Sums comprehension-map cells. Counts only; no rates, no guessed scores. */
export function aggregateCells(cells: MapCell[]): CellSummary {
  let demonstrated = 0;
  let struggling = 0;
  let pass = 0;
  let fail = 0;
  let pending = 0;
  for (const c of cells) {
    if (c.status === 'demonstrated') demonstrated += 1;
    else if (c.status === 'struggling') struggling += 1;
    pass += c.pass;
    fail += c.fail;
    pending += c.pending;
  }
  return {
    total: cells.length,
    demonstrated,
    struggling,
    other: cells.length - demonstrated - struggling,
    pass,
    fail,
    pending,
  };
}

export interface QuizLike {
  project_id: string;
  type: string;
  status: string;
}

export interface TypeCounts {
  locate: number;
  predict: number;
  explain_back: number;
  other: number;
}

/** Counts per question type for non-retired quizzes of one project. */
export function quizTypeCounts(quizzes: QuizLike[], project: string): TypeCounts {
  const counts: TypeCounts = { locate: 0, predict: 0, explain_back: 0, other: 0 };
  for (const q of quizzes) {
    if (q.project_id !== project || q.status === 'retired') continue;
    if (q.type === 'locate') counts.locate += 1;
    else if (q.type === 'predict') counts.predict += 1;
    else if (q.type === 'explain_back') counts.explain_back += 1;
    else counts.other += 1;
  }
  return counts;
}
