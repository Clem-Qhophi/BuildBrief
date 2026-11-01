import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  compileChecks,
  type CompileInput,
} from '../src/index.js';
import {
  contentHash,
  type AtomicCriterion,
  type IntentVersion,
} from '@buildbrief/domain';

function criterion(overrides: Partial<AtomicCriterion> & { id: string }): AtomicCriterion {
  return { text: 'criterion', keywords: [], ...overrides };
}

function approvedIntent(criteria: AtomicCriterion[]): IntentVersion {
  return {
    id: 'bb_intent_test1',
    project_id: 'referral',
    feature_id: 'referral',
    version: 1,
    kind: 'feature',
    state: 'approved',
    exact_source_text: 'Add referral codes with 20 percent credit. Codes expire after 30 days. Do not modify authentication.',
    source_hash: contentHash('seed'),
    captured_at: '2026-11-01T10:00:00.000Z',
    capture_completeness: 'manual',
    normalized_text: 'Referral codes with expiry; authentication untouched.',
    criteria,
    non_goals: [],
    constraints: [{ rule: 'Do not modify authentication', paths: ['src/auth.js'] }],
    ambiguity_flags: [],
    approved_by: 'Owner',
    approved_at: '2026-11-01T10:00:00.000Z',
  };
}

function seedInput(): CompileInput {
  return {
    project_id: 'referral',
    intent: approvedIntent([
      criterion({ id: 'c-expiry', text: 'Codes expire after 30 days', keywords: ['expir', 'referral'] }),
      criterion({ id: 'c-auth', text: 'Do not modify authentication', keywords: ['auth'], negative: true }),
    ]),
    repo: {
      revision: 'abc123',
      testCommand: 'npm test',
      testCovers: ['src/referral.js'],
      buildCommand: 'npm run build',
    },
  };
}

test('seeded referral intent compiles test and path checks', () => {
  const result = compileChecks(seedInput());
  assert.equal(result.ok, true);
  if (!result.ok) return;
  const types = result.checks.map((c) => c.type);
  assert.ok(types.includes('test'), 'needs a test check');
  assert.ok(types.includes('path'), 'needs a path check');
  assert.ok(types.includes('build'), 'build command is known');
  const path = result.checks.find((c) => c.type === 'path');
  assert.deepEqual(path?.protected_path, ['src/auth.js']);
  assert.equal(path?.command, undefined);
  const testCheck = result.checks.find((c) => c.type === 'test' && c.criterion_id === 'c-expiry');
  assert.match(testCheck?.expect ?? '', /exit 0/);
  assert.match(testCheck?.expect ?? '', /src\/referral\.js/);
});

test('compilation is reproducible at one revision and revision-pinned', () => {
  const first = compileChecks(seedInput());
  const second = compileChecks(seedInput());
  assert.equal(first.ok, true);
  assert.equal(second.ok, true);
  if (!first.ok || !second.ok) return;
  assert.deepEqual(first.checks, second.checks);
  assert.ok(first.checks.every((c) => c.revision === 'abc123' && c.status === 'pending'));
});

test('drafts never become checks', () => {
  const input = seedInput();
  input.intent.state = 'draft';
  const result = compileChecks(input);
  assert.equal(result.ok, false);
});

test('criteria with no deterministic mapping become labelled model checks', () => {
  const result = compileChecks({
    project_id: 'idea',
    intent: approvedIntent([criterion({ id: 'c-vibe', text: 'Feels fast' })]),
    repo: { revision: 'rev1' },
  });
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.deepEqual(result.checks.map((c) => c.type), ['model']);
});

test('negative criteria without known paths fall back to model judgement', () => {
  const intent = approvedIntent([criterion({ id: 'c-neg', text: 'Do not track users', negative: true })]);
  intent.constraints = [];
  const result = compileChecks({ project_id: 'p', intent, repo: { revision: 'r', testCommand: 'npm test' } });
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.deepEqual(result.checks.map((c) => c.type), ['test']);
});
