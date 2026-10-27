import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  appendEvent,
  loadViews,
  openProjectStore,
  readEvents,
  rebuildViews,
  verifyChain,
} from '../src/index.js';

function tmpStore(): ReturnType<typeof openProjectStore> {
  return openProjectStore(mkdtempSync(join(tmpdir(), 'bb-store-')), 'proj1');
}

describe('append-only ledger', () => {
  it('appends hash-chained events and verifies', () => {
    const s = tmpStore();
    appendEvent(s, 'prompt.captured', 'proj1', { text: 'hello' });
    appendEvent(s, 'intent.extracted', 'proj1', { intent: { id: 'x' } });
    assert.equal(readEvents(s, 'proj1').length, 2);
    assert.deepEqual(verifyChain(s, 'proj1'), { ok: true });
  });

  it('rejects unknown event types', () => {
    const s = tmpStore();
    assert.throws(() => appendEvent(s, 'bogus.type' as never, 'proj1', {}), /unknown event type/);
  });

  it('rebuilds views deterministically', () => {
    const s = tmpStore();
    const intent = {
      id: 'i1', project_id: 'proj1', feature_id: 'f', version: 1, kind: 'feature', state: 'approved',
      exact_source_text: 't', source_hash: 'a'.repeat(64), captured_at: '2026-10-27T00:00:00.000Z',
      capture_completeness: 'manual', normalized_text: 't', criteria: [], non_goals: [],
      constraints: [{ rule: 'r' }], ambiguity_flags: [],
    };
    appendEvent(s, 'intent.approved', 'proj1', { intent });
    const v1 = rebuildViews(s, 'proj1');
    assert.equal(v1.approvedByFeature['f'], 'i1');
    const v2 = rebuildViews(s, 'proj1');
    assert.deepEqual(v1, v2);
    assert.deepEqual(loadViews(s).intents['i1']?.state, 'approved');
  });
});
