import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { AB_TASKS, renderAbTable, type AbRow } from '../src/ab.js';

function row(overrides: Partial<AbRow> = {}): AbRow {
  return {
    task: 'ab-demo',
    verdictsAgree: true,
    expectationsMet: true,
    questionsAsked: 3,
    deterministicChecks: 4,
    packsBuilt: 1,
    orphansExpectedCaught: 1,
    unexpectedHighRisk: 0,
    tokensUsed: 0,
    turnsToAcceptance: 'unmeasured (needs live agent)',
    ...overrides,
  };
}

describe('a/b table', () => {
  it('declares three tasks with ground truth before running', () => {
    assert.equal(AB_TASKS.length, 3);
    for (const task of AB_TASKS) {
      assert.ok(task.id.length > 0 && task.prompt.length > 0);
      assert.ok(task.criteria.length > 0 && task.candidates.length > 0);
      assert.ok(Object.keys(task.expected).length > 0);
    }
  });

  it('renders agreement, structure counts and unmeasured turns honestly', () => {
    const table = renderAbTable([row(), row({ task: 'ab-tied', verdictsAgree: false, expectationsMet: false, unexpectedHighRisk: 1 })]);
    assert.match(table, /ab-demo \| yes \| yes \| 3 \| 4 \| 1 \| 1 \| 0 \| 0 \| unmeasured/);
    assert.match(table, /ab-tied \| NO \| NO/);
  });
});
