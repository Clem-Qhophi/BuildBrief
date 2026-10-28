import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { extractDraft, keywordsOf } from '@buildbrief/domain';

const BASE = {
  projectId: 'p',
  featureId: 'f',
  prompt: '',
  completeness: 'manual' as const,
};

describe('deterministic draft extraction', () => {
  it('splits obligations, prohibitions, and questions without resolving them', () => {
    const draft = extractDraft({
      ...BASE,
      prompt: 'Add referral codes. Codes expire after 30 days. Do not modify authentication. Refunds unclear?',
    });
    assert.equal(draft.state, 'draft');
    // Two obligations + one prohibition + one question.
    assert.equal(draft.criteria.length, 2);
    assert.equal(draft.constraints.length, 1);
    assert.equal(draft.ambiguity_flags.length, 1);
    assert.match(draft.constraints[0]?.rule ?? '', /Do not modify authentication/);
  });

  it('keeps conflicting statements as separate criteria (no silent resolution)', () => {
    const draft = extractDraft({
      ...BASE,
      prompt: 'Codes expire after 30 days. Codes expire after 60 days.',
    });
    assert.equal(draft.criteria.length, 2);
    assert.ok(draft.criteria.every((c) => c.keywords.length > 0));
  });

  it('never approves: output is always draft', () => {
    const draft = extractDraft({ ...BASE, prompt: 'Do everything perfectly.' });
    assert.equal(draft.state, 'draft');
    assert.equal(draft.approved_by, undefined);
  });

  it('extracts stable keyword sets', () => {
    assert.deepEqual(keywordsOf('Referral codes expire after days'), ['referral', 'codes', 'expire', 'days']);
    assert.deepEqual(keywordsOf('The and or to of'), []);
  });
});
