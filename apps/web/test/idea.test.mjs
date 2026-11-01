import { test } from 'node:test';
import assert from 'node:assert/strict';
import { approveIntent, contentHash } from '@buildbrief/domain';
import { ideaDraft, buildHandoff } from '../lib/idea.ts';

const input = { project: 'Reading journal', idea: 'A private place to remember books.', audience: 'People who read at work.', behaviors: 'Save a book note. Find notes by book title.', boundaries: 'No payments in the first build.', questions: 'Should notes be exportable?' };
test('idea capture preserves context while separating behaviors, audience, and open questions', () => {
  const draft = ideaDraft(input);
  assert.equal(draft.state, 'draft');
  assert.deepEqual(draft.criteria.map((c) => c.text), ['Save a book note.', 'Find notes by book title.']);
  assert.ok(draft.exact_source_text.includes(input.audience));
  assert.equal(draft.source_hash, contentHash(draft.exact_source_text));
  assert.ok(draft.constraints.some((c) => c.rule === input.boundaries));
  assert.ok(draft.ambiguity_flags.includes(input.questions));
  assert.equal(draft.approved_by, undefined);
  assert.throws(() => buildHandoff(draft), /Approve/);
});
test('only a human-approved brief can produce a version-bound implementation handoff', () => {
  const draft = ideaDraft(input);
  const approval = approveIntent({ intent: draft, actor: 'Test persona' });
  assert.equal(approval.ok, true);
  const text = buildHandoff(approval.intent);
  assert.ok(text.includes(draft.id));
  assert.ok(text.includes(input.questions));
  assert.ok(text.includes(input.boundaries));
  assert.ok(text.includes('initialize Git'));
  assert.ok(text.includes('not claim the work is accepted'));
});
test('an idea needs a project, a description, and an initial behavior', () => {
  for (const patch of [{ project: '' }, { idea: '' }, { behaviors: '' }]) assert.throws(() => ideaDraft({ ...input, ...patch }));
});
