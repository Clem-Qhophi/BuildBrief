import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  appendEvent,
  latestRevision,
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

describe('latestRevision', () => {
  const finding = (id: string, revision: string, at: string): Parameters<typeof latestRevision>[0][number] => ({
    id,
    project_id: 'p',
    requirement_version_id: 'i',
    criterion_id: 'd-c1',
    checked_revision: revision,
    finding: 'partial',
    evidence_ids: [],
    evidence_grade: 'E1_source',
    coverage: { examined_files: 1, relevant_files: 1, gaps: [], negative_search_sufficient: false },
    confidence: 0.5,
    rationale: 'r',
    missing_proof: [],
    provider: 'rules',
    model: 'rules-v1',
    prompt_version: 'v1',
    run_id: 'run',
    created_at: at,
    stale: false,
  });

  it('orders by finding time, not lexicographic SHA (regression)', () => {
    // Older finding carries the lexicographically LARGER sha: string-max
    // would wrongly call 4c03a57 "current" over the newer 2347922.
    const findings = [
      finding('f1', '4c03a573fae8a2f950393b565e1074bd82bb7618', '2026-10-28T10:00:00.000Z'),
      finding('f2', '2347922f530e3a32312ac5d48e22a2ab14b54e30', '2026-10-28T11:00:00.000Z'),
    ];
    assert.equal(latestRevision(findings), '2347922f530e3a32312ac5d48e22a2ab14b54e30');
  });

  it('returns empty string with no findings', () => {
    assert.equal(latestRevision([]), '');
  });
});

describe('read-only stores stay read-only', () => {
  it('opening a store and rebuilding views creates no directories', () => {
    const dir = mkdtempSync(join(tmpdir(), 'bb-store-ro-'));
    const s = openProjectStore(dir, 'proj1');
    rebuildViews(s, 'proj1');
    assert.equal(existsSync(join(dir, '.buildbrief')), false);
  });

  it('first write creates the directories', () => {
    const dir = mkdtempSync(join(tmpdir(), 'bb-store-w-'));
    const s = openProjectStore(dir, 'proj1');
    appendEvent(s, 'prompt.captured', 'proj1', { text: 'hello' });
    assert.equal(existsSync(join(dir, '.buildbrief', 'events.jsonl')), true);
  });
});
