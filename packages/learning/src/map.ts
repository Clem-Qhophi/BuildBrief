import {
  type QuizItem,
  type QuizResponse,
} from '@buildbrief/domain';

export type CellStatus =
  | 'demonstrated'
  | 'struggling'
  | 'pending'
  | 'untested'
  | 'stale'
  | 'unmeasured';

export interface MapCell {
  criterion_id: string;
  criterion_text: string;
  finding: string;
  status: CellStatus;
  quiz_count: number;
  pass: number;
  fail: number;
  pending: number;
  note: string;
}

export interface MapInput {
  criteria: { id: string; text: string }[];
  /** Latest known finding per criterion id ('—' when never verified). */
  findings: Map<string, string>;
  quizzes: QuizItem[];
  responses: QuizResponse[];
  currentRevision: string;
}

/**
 * Builds the comprehension map from recorded quiz activity. Only responses
 * against non-retired quizzes at the current revision count; everything else
 * degrades honestly toward stale/untested/unmeasured. No percentages without
 * denominators, no colors without data.
 */
export function comprehensionMap(input: MapInput): MapCell[] {
  const quizzesByCriterion = new Map<string, QuizItem[]>();
  for (const q of input.quizzes) {
    for (const cid of q.criterion_ids) {
      const list = quizzesByCriterion.get(cid) ?? [];
      list.push(q);
      quizzesByCriterion.set(cid, list);
    }
  }
  const responsesByQuiz = new Map<string, QuizResponse[]>();
  for (const r of input.responses) {
    const list = responsesByQuiz.get(r.quiz_id) ?? [];
    list.push(r);
    responsesByQuiz.set(r.quiz_id, list);
  }

  return input.criteria.map((c) => {
    const quizzes = quizzesByCriterion.get(c.id) ?? [];
    const live = quizzes.filter((q) => q.status !== 'retired' && q.revision === input.currentRevision);
    const finding = input.findings.get(c.id) ?? '—';
    if (quizzes.length === 0) {
      return cell(c, finding, 'unmeasured', 0, 0, 0, 0, 'no questions exist for this criterion');
    }
    if (live.length === 0) {
      return cell(c, finding, 'stale', quizzes.length, 0, 0, 0, 'all questions retired or pinned to older revisions');
    }
    let pass = 0;
    let fail = 0;
    let pending = 0;
    for (const q of live) {
      for (const r of responsesByQuiz.get(q.id) ?? []) {
        if (r.graded === 'pass') pass += 1;
        else if (r.graded === 'fail') fail += 1;
        else pending += 1;
      }
    }
    if (pass > 0) return cell(c, finding, 'demonstrated', live.length, pass, fail, pending, `${pass} passing answer(s) at the current revision`);
    if (fail > 0) return cell(c, finding, 'struggling', live.length, pass, fail, pending, `${fail} failing answer(s), none passing`);
    if (pending > 0) return cell(c, finding, 'pending', live.length, pass, fail, pending, `${pending} answer(s) awaiting human grade`);
    return cell(c, finding, 'untested', live.length, 0, 0, 0, `${live.length} live question(s), no answers yet`);
  });
}

function cell(
  c: { id: string; text: string },
  finding: string,
  status: CellStatus,
  quiz_count: number,
  pass: number,
  fail: number,
  pending: number,
  note: string,
): MapCell {
  return {
    criterion_id: c.id,
    criterion_text: c.text,
    finding,
    status,
    quiz_count,
    pass,
    fail,
    pending,
    note,
  };
}
