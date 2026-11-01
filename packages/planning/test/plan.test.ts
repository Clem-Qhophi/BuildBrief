import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  FIRST_PASS_BUDGET,
  planQuestions,
  repoAnsweredBy,
  type QuestionCandidate,
  type RepoFacts,
} from '../src/index.js';

function candidate(overrides: Partial<QuestionCandidate> & { text: string }): QuestionCandidate {
  return {
    layer: 'product',
    why_it_matters: 'Changes scope.',
    options: [{ label: 'Option A', tradeoff: 'Simple.', recommended: true }],
    impact: 4,
    ambiguity: 4,
    answerability: 4,
    reversibility_cost: 2,
    ...overrides,
  };
}

function texts(project: string, candidates: QuestionCandidate[], repoFacts: RepoFacts, budget?: number): { asked: string[]; skipped: string[] } {
  const batch = planQuestions({ project_id: project, candidates, repoFacts, ...(budget !== undefined ? { budget } : {}) });
  return { asked: batch.asked.map((q) => q.text), skipped: batch.skipped.map((s) => s.text) };
}

// Greenfield scenarios: no repository facts, everything unknown.

test('greenfield invoice app asks product facts first, technical last', () => {
  const { asked } = texts('invoice', [
    candidate({ layer: 'technical', text: 'Which database?', impact: 2, ambiguity: 3, answerability: 2, reversibility_cost: 4 }),
    candidate({ layer: 'product', text: 'Who sends invoices?', impact: 5, ambiguity: 5, answerability: 5, reversibility_cost: 3 }),
    candidate({ layer: 'boundary', text: 'Is online payment in scope?', impact: 5, ambiguity: 4, answerability: 5, reversibility_cost: 4 }),
  ], {});
  assert.deepEqual(asked, ['Who sends invoices?', 'Is online payment in scope?', 'Which database?']);
});

test('greenfield landing clone keeps the batch within budget', () => {
  const candidates = Array.from({ length: 9 }, (_, i) => candidate({ text: `Question ${i + 1}` }));
  const batch = planQuestions({ project_id: 'landing', candidates, repoFacts: {} });
  assert.equal(batch.asked.length, FIRST_PASS_BUDGET);
  assert.equal(batch.skipped.length, 3);
  assert.ok(batch.asked.every((q) => q.status === 'asked' && q.project_id === 'landing'));
});

test('greenfield referral feature offers decide-for-me only on reversible choices', () => {
  const batch = planQuestions({
    project_id: 'referral', repoFacts: {},
    candidates: [
      candidate({ text: 'Reversible copy choice?', reversibility_cost: 1 }),
      candidate({ text: 'Irreversible data choice?', reversibility_cost: 5 }),
    ],
  });
  const byText = new Map(batch.asked.map((q) => [q.text, q]));
  assert.equal(byText.get('Reversible copy choice?')?.allow_decide_for_me, true);
  assert.equal(byText.get('Irreversible data choice?')?.allow_decide_for_me, false);
});

test('greenfield CSV export skips invalid candidates with a reason', () => {
  const { asked, skipped } = texts('csv', [
    candidate({ text: 'Which delimiter?' }),
    candidate({ text: '', impact: 3, ambiguity: 3, answerability: 3 }),
  ], {});
  assert.deepEqual(asked, ['Which delimiter?']);
  assert.deepEqual(skipped, ['']);
});

test('greenfield rate limiter keeps question ids stable across runs', () => {
  const candidates = [candidate({ text: 'Which routes are limited?' })];
  const first = planQuestions({ project_id: 'ratelimit', candidates, repoFacts: {} });
  const second = planQuestions({ project_id: 'ratelimit', candidates, repoFacts: {} });
  assert.equal(first.asked[0]?.id, second.asked[0]?.id);
});

// Existing-repo scenarios: facts answer some candidates.

test('existing repo never asks about its own stack', () => {
  assert.equal(repoAnsweredBy({ repoKeys: ['stack', 'framework'] }, { stack: 'Next.js', framework: 'React' }), true);
  assert.equal(repoAnsweredBy({ repoKeys: ['stack'] }, {}), false);
  const { asked, skipped } = texts('shop', [
    candidate({ layer: 'technical', text: 'Which framework?', repoKeys: ['framework'] }),
    candidate({ layer: 'product', text: 'Who checks out?' }),
  ], { framework: 'React', stack: 'Next.js' });
  assert.deepEqual(asked, ['Who checks out?']);
  assert.deepEqual(skipped, ['Which framework?']);
});

test('existing repo with tests skips the test-setup question', () => {
  const { asked } = texts('api', [
    candidate({ layer: 'technical', text: 'Which test runner?', repoKeys: ['hasTests'] }),
    candidate({ layer: 'quality', text: 'What does done mean for this endpoint?' }),
  ], { hasTests: true });
  assert.deepEqual(asked, ['What does done mean for this endpoint?']);
});

test('existing repo still asks what only the owner knows', () => {
  const full: RepoFacts = { stack: 'Node', framework: 'Express', packageManager: 'npm', languages: ['TypeScript'], hasTests: true, entryPoints: ['src/index.ts'] };
  const { asked } = texts('billing', [
    candidate({ layer: 'technical', text: 'Which framework?', repoKeys: ['framework'] }),
    candidate({ layer: 'product', text: 'Who approves refunds?' }),
    candidate({ layer: 'boundary', text: 'Are partial refunds in scope?' }),
  ], full);
  assert.deepEqual(asked, ['Who approves refunds?', 'Are partial refunds in scope?']);
});

test('critical unresolved decisions may exceed the budget with a reason', () => {
  const candidates = [
    ...Array.from({ length: 6 }, (_, i) => candidate({ text: `Routine ${i + 1}`, impact: 2, ambiguity: 2, answerability: 2 })),
    candidate({ text: 'Critical data residency?', impact: 1, ambiguity: 1, answerability: 1, reversibility_cost: 5, critical: true }),
  ];
  const batch = planQuestions({ project_id: 'vault', candidates, repoFacts: {}, budget: 6 });
  assert.ok(batch.asked.some((q) => q.text === 'Critical data residency?'));
  assert.equal(batch.asked.length, 7);
});

test('non-critical overflow is cut with a reason, not silently dropped', () => {
  const candidates = Array.from({ length: 8 }, (_, i) => candidate({ text: `Extra ${i + 1}`, impact: 1, ambiguity: 1, answerability: 1 }));
  const batch = planQuestions({ project_id: 'wiki', candidates, repoFacts: {}, budget: 6 });
  assert.equal(batch.asked.length, 6);
  assert.equal(batch.skipped.length, 2);
  assert.ok(batch.skipped.every((s) => s.reason.length > 0));
});
