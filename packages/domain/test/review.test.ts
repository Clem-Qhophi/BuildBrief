import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeReviewDecision, type ReviewDecision } from '../src/index.js';

function decision(): ReviewDecision {
  return { project_id: 'demo', run_id: 'bb_run_abcdef', revision: 'a'.repeat(40), requirement_version_id: 'intent-1', outcome: 'changes_requested', actor: ' Owner ', note: ' Fix the expiry rule before release. ', at: '2026-10-29T12:00:00.000Z' };
}

test('review is an explicit named decision pinned to the checked version', () => {
  const source = decision();
  const result = makeReviewDecision(source);
  assert.equal(result.actor, 'Owner');
  assert.equal(result.note, 'Fix the expiry rule before release.');
  assert.equal(result.revision, source.revision);
  assert.equal(result.outcome, 'changes_requested');
  assert.equal(source.actor, ' Owner ');
});
test('review cannot be recorded without a person, reason, or real report reference', () => {
  for (const patch of [{ actor: '' }, { note: '' }, { revision: 'not-a-revision' }, { run_id: '../other' }, { outcome: 'auto_accept' }, { at: '' }]) {
    assert.throws(() => makeReviewDecision({ ...decision(), ...patch } as ReviewDecision));
  }
});
test('acceptance and unresolved-evidence decisions remain distinct', () => {
  assert.equal(makeReviewDecision({ ...decision(), outcome: 'accepted' }).outcome, 'accepted');
  assert.equal(makeReviewDecision({ ...decision(), outcome: 'more_evidence' }).outcome, 'more_evidence');
});
