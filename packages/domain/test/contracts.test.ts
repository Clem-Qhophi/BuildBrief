import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  EVENT_TYPES,
  gateAfterLoop,
  isDeterministicCheck,
  isEventType,
  MAX_GATE_LOOPS,
  questionScore,
  rankQuestions,
  validateAcceptanceCheck,
  validateAgentEvent,
  validateCapabilityManifest,
  validateDecision,
  validateGateRecord,
  validateQuestion,
  type AcceptanceCheck,
  type ClarificationQuestion,
} from '../src/index.js';

function question(overrides: Partial<ClarificationQuestion> = {}): ClarificationQuestion {
  return {
    id: 'q1',
    project_id: 'p1',
    layer: 'product',
    text: 'Who sends invoices?',
    why_it_matters: 'Decides scope and tax rules.',
    options: [{ label: 'Freelancers', tradeoff: 'Simpler scope.', recommended: true }],
    allow_custom: true,
    allow_defer: true,
    allow_decide_for_me: false,
    impact: 5,
    ambiguity: 4,
    answerability: 5,
    reversibility_cost: 2,
    source: 'template',
    status: 'asked',
    ...overrides,
  };
}

test('questions validate shape and rank by value over reversibility', () => {
  assert.equal(validateQuestion(question()).ok, true);
  assert.equal(validateQuestion({ ...question(), text: '' }).ok, false);
  assert.equal(validateQuestion({ ...question(), impact: 9 }).ok, false);
  assert.equal(validateQuestion({ ...question(), options: [] }).ok, false);
  const cheap = question({ id: 'cheap', impact: 5, ambiguity: 5, answerability: 5, reversibility_cost: 1 });
  const costly = question({ id: 'costly', impact: 5, ambiguity: 5, answerability: 5, reversibility_cost: 5 });
  assert.ok(questionScore(cheap) > questionScore(costly));
  assert.deepEqual(rankQuestions([costly, cheap]).map((q) => q.id), ['cheap', 'costly']);
});

test('decisions require a named human actor, never agent inference', () => {
  const base = { question_id: 'q1', project_id: 'p1', chosen: 'Freelancers', source: 'user', actor: 'Owner', at: '2026-11-01T10:00:00.000Z' } as const;
  assert.equal(validateDecision(base).ok, true);
  assert.equal(validateDecision({ ...base, actor: '  ' }).ok, false);
  assert.equal(validateDecision({ ...base, chosen: '' }).ok, false);
});

test('acceptance checks label deterministic work and settle terminally', () => {
  const check: AcceptanceCheck = {
    id: 'chk1', intent_version_id: 'bb_intent_x', criterion_id: 'c1',
    type: 'test', command: 'npm test', status: 'pending', revision: 'abc123', evidence_ids: [],
  };
  assert.equal(validateAcceptanceCheck(check).ok, true);
  assert.equal(isDeterministicCheck(check), true);
  assert.equal(isDeterministicCheck({ type: 'model' }), false);
  assert.equal(validateAcceptanceCheck({ ...check, type: 'path', command: 'ls' }).ok, false);
  assert.equal(validateAcceptanceCheck({ ...check, status: 'nope' }).ok, false);
});

test('capability manifests describe exactly what was probed', () => {
  const events = {
    session_started: 'synchronous', prompt_submitted: 'synchronous', tool_proposed: 'unavailable',
    permission_decided: 'unavailable', tool_completed: 'asynchronous', file_changed: 'unavailable',
    command_run: 'unavailable', test_completed: 'unavailable', turn_ended: 'synchronous',
    session_ended: 'synchronous',
  } as const;
  const base = {
    provider: 'muse', provider_version: '1.4.14', transport: 'stdio',
    events, elicitation: 'none', enforcement: 'advisory',
    approvals_supported: false, probed_at: '2026-11-01T10:00:00.000Z',
  } as const;
  assert.equal(validateCapabilityManifest(base).ok, true);
  assert.equal(validateCapabilityManifest({ ...base, provider_version: '' }).ok, false);
  assert.equal(validateCapabilityManifest({ ...base, enforcement: 'blocking-everything' }).ok, false);
});

test('agent events carry provenance and gates cap automated loops', () => {
  const event = {
    id: 'e1', session_id: 's1', project_id: 'p1', name: 'file_changed',
    captured_via: 'git-reconcile', at: '2026-11-01T10:00:00.000Z',
  } as const;
  assert.equal(validateAgentEvent(event).ok, true);
  assert.equal(validateAgentEvent({ ...event, captured_via: 'guessed' }).ok, false);
  assert.equal(MAX_GATE_LOOPS, 3);
  assert.equal(gateAfterLoop(2), 'blocked');
  assert.equal(gateAfterLoop(3), 'escalate_human');
  const gate = { session_id: 's1', project_id: 'p1', loops: 3, disposition: 'override', override_reason: 'Acceptable drift', override_actor: 'Owner', at: '2026-11-01T10:00:00.000Z' } as const;
  assert.equal(validateGateRecord(gate).ok, true);
  assert.equal(validateGateRecord({ ...gate, loops: 4 }).ok, false);
  assert.equal(validateGateRecord({ ...gate, override_reason: '' }).ok, false);
});

test('new contract event types extend the ledger without removing history', () => {
  for (const t of ['prompt.captured', 'intent.approved', 'finding.recorded', 'review.decision_recorded']) {
    assert.equal(isEventType(t), true);
  }
  for (const t of ['question.asked', 'decision.recorded', 'check.recorded', 'check.completed', 'agent.session_started', 'agent.event_recorded', 'gate.decided']) {
    assert.equal(isEventType(t), true);
  }
  assert.equal(isEventType('sql.query'), false);
  assert.ok(EVENT_TYPES.length >= 22);
});
