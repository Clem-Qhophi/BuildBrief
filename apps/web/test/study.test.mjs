import { test } from 'node:test';
import assert from 'node:assert/strict';
import { aggregateCells, quizTypeCounts } from '../lib/study.ts';

function cell(status, pass = 0, fail = 0, pending = 0) {
  return { criterion_id: 'c', criterion_text: 't', finding: 'f', status, quiz_count: 1, pass, fail, pending, note: '' };
}

test('study aggregates cell statuses and answer counts without rates', () => {
  const summary = aggregateCells([
    cell('demonstrated', 2, 0, 1),
    cell('struggling', 0, 1, 0),
    cell('untested'),
    cell('stale'),
  ]);
  assert.deepEqual(summary, { total: 4, demonstrated: 1, struggling: 1, other: 2, pass: 2, fail: 1, pending: 1 });
});

test('study aggregates an empty map to zeros', () => {
  assert.deepEqual(aggregateCells([]), { total: 0, demonstrated: 0, struggling: 0, other: 0, pass: 0, fail: 0, pending: 0 });
});

test('study counts live question types per project, excluding retired and foreign quizzes', () => {
  const counts = quizTypeCounts([
    { project_id: 'p', type: 'locate', status: 'validated' },
    { project_id: 'p', type: 'locate', status: 'draft' },
    { project_id: 'p', type: 'predict', status: 'validated' },
    { project_id: 'p', type: 'explain_back', status: 'validated' },
    { project_id: 'p', type: 'locate', status: 'retired' },
    { project_id: 'other', type: 'locate', status: 'validated' },
    { project_id: 'p', type: 'mystery', status: 'validated' },
  ], 'p');
  assert.deepEqual(counts, { locate: 2, predict: 1, explain_back: 1, other: 1 });
});
