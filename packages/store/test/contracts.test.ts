import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  appendEvent,
  openProjectStore,
  rebuildViews,
} from '../src/index.js';

function tmpStore(): ReturnType<typeof openProjectStore> {
  return openProjectStore(mkdtempSync(join(tmpdir(), 'bb-contracts-')), 'proj1');
}

describe('contract events (BB-010)', () => {
  it('legacy ledgers rebuild identically with empty contract views', () => {
    const s = tmpStore();
    appendEvent(s, 'prompt.captured', 'proj1', { text: 'hello' });
    appendEvent(s, 'intent.extracted', 'proj1', { intent: { id: 'x' } });
    const v = rebuildViews(s, 'proj1');
    assert.deepEqual(v.questions, {});
    assert.deepEqual(v.decisions, {});
    assert.deepEqual(v.checks, {});
    assert.deepEqual(v.sessions, {});
    assert.deepEqual(v.sessionEvents, {});
    assert.deepEqual(v.gates, {});
    // Legacy views are untouched by the new maps.
    assert.deepEqual(Object.keys(v.intents), ['x']);
  });

  it('question, decision, check, session, event and gate round-trip', () => {
    const s = tmpStore();
    appendEvent(s, 'question.asked', 'proj1', {
      question: { id: 'q1', layer: 'product' },
    });
    appendEvent(s, 'decision.recorded', 'proj1', {
      decision: { question_id: 'q1', chosen: 'Freelancers', actor: 'Owner' },
    });
    appendEvent(s, 'check.recorded', 'proj1', {
      check: { id: 'chk1', status: 'pending' },
    });
    appendEvent(s, 'check.completed', 'proj1', {
      check: { id: 'chk1', status: 'pass' },
    });
    appendEvent(s, 'agent.session_started', 'proj1', {
      session: { id: 's1' },
    });
    appendEvent(s, 'agent.event_recorded', 'proj1', {
      event: { session_id: 's1', name: 'file_changed' },
    });
    appendEvent(s, 'gate.decided', 'proj1', {
      gate: { session_id: 's1', loops: 3, disposition: 'override' },
    });
    const v = rebuildViews(s, 'proj1');
    assert.equal(v.questions['q1']?.layer, 'product');
    // A recorded decision marks its question answered.
    assert.equal(v.questions['q1']?.status, 'answered');
    assert.equal(v.decisions['q1']?.chosen, 'Freelancers');
    assert.equal(v.checks['chk1']?.status, 'pass');
    assert.equal(v.sessions['s1']?.id, 's1');
    assert.equal(v.sessionEvents['s1']?.length, 1);
    assert.equal(v.gates['s1']?.disposition, 'override');
    // Rebuilds stay deterministic with the new maps included.
    assert.deepEqual(rebuildViews(s, 'proj1'), v);
  });
});
