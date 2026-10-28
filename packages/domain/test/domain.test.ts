import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  adjudicate,
  amendIntent,
  approveIntent,
  buildCorrectionPack,
  contentHash,
  gradeLocate,
  resolveCitation,
  riskForPath,
  stableId,
  validateIntentVersion,
  validateQuizItem,
  type AtomicCriterion,
  type EvidencePointer,
  type IntentVersion,
  type ProposedVerdict,
  type QuizItem,
} from '../src/index.js';

function draftIntent(overrides: Partial<IntentVersion> = {}): IntentVersion {
  const crit: AtomicCriterion = { id: 'c1', text: 'Referral code expires 30 days after issue', keywords: ['expir', 'referral', 'ttl'] };
  return {
    id: stableId('intent', 't1'),
    project_id: 'p1',
    feature_id: 'referral',
    version: 1,
    kind: 'feature',
    state: 'draft',
    exact_source_text: 'Add referral codes that expire after 30 days.',
    source_hash: contentHash('Add referral codes that expire after 30 days.'),
    captured_at: '2026-10-27T10:00:00.000Z',
    capture_completeness: 'manual',
    normalized_text: 'Referral codes expire 30 days after issue.',
    criteria: [crit],
    non_goals: [],
    constraints: [],
    ambiguity_flags: [],
    ...overrides,
  };
}

function ev(partial: Partial<EvidencePointer> & { id: string }): EvidencePointer {
  return {
    tier: 'E1_source',
    revision: 'abc123',
    collected_at: '2026-10-27T11:00:00.000Z',
    is_stale: false,
    description: 'source span',
    ...partial,
  };
}

describe('intent lifecycle', () => {
  it('approves a draft with actor and contract', () => {
    const r = approveIntent({ intent: draftIntent(), actor: 'owner-1' });
    assert.equal(r.ok, true);
    assert.equal(r.ok && r.intent.state, 'approved');
    assert.equal(r.ok && r.intent.approved_by, 'owner-1');
  });

  it('rejects approval without an actor', () => {
    const r = approveIntent({ intent: draftIntent(), actor: '   ' });
    assert.equal(r.ok, false);
    assert.equal(r.ok === false && r.error.code, 'MISSING_ACTOR');
  });

  it('rejects approval of an empty contract', () => {
    const r = approveIntent({ intent: draftIntent({ criteria: [], constraints: [] }), actor: 'o' });
    assert.equal(r.ok, false);
    assert.equal(r.ok === false && r.error.code, 'EMPTY_CONTRACT');
  });

  it('rejects double approval and approval from terminal states', () => {
    const first = approveIntent({ intent: draftIntent(), actor: 'o' });
    assert.equal(first.ok, true);
    if (!first.ok) return;
    const second = approveIntent({ intent: first.intent, actor: 'o' });
    assert.equal(second.ok, false);
  });

  it('amendment retires old version and births N+1 draft', () => {
    const a = approveIntent({ intent: draftIntent(), actor: 'o' });
    assert.equal(a.ok, true);
    if (!a.ok) return;
    const m = amendIntent(a.intent, (d) => ({ ...d, normalized_text: 'changed' }), { actor: 'o' });
    assert.equal(m.ok, true);
    if (!m.ok) return;
    assert.equal(m.retired.state, 'superseded');
    assert.equal(m.draft.version, 2);
    assert.equal(m.draft.state, 'draft');
    assert.equal(m.draft.supersedes_id, a.intent.id);
    assert.equal(m.draft.approved_by, undefined);
  });

  it('validates intent payloads at trust boundaries', () => {
    assert.equal(validateIntentVersion(draftIntent()).ok, true);
    assert.equal(validateIntentVersion({}).ok, false);
    assert.equal(validateIntentVersion(draftIntent({ source_hash: 'zzz' })).ok, false);
  });
});

describe('citation resolver', () => {
  const lookup = (files: Record<string, string>, rev: string) => (path: string) =>
    files[path] === undefined ? null : { text: files[path] as string, revision: rev };

  it('accepts a valid span', () => {
    const e = ev({ id: 'e1', path: 'src/a.ts', line_start: 1, line_end: 2 });
    const r = resolveCitation(e, lookup({ 'src/a.ts': 'line1\nline2\nline3' }, 'abc123'), 'abc123');
    assert.deepEqual(r, { ok: true });
  });

  it('rejects unknown path, out-of-range lines, revision mismatch, stale', () => {
    const files = { 'src/a.ts': 'one\ntwo' };
    assert.deepEqual(
      resolveCitation(ev({ id: 'e1', path: 'nope.ts' }), lookup(files, 'abc123'), 'abc123'),
      { ok: false, reason: 'UNKNOWN_PATH' },
    );
    assert.deepEqual(
      resolveCitation(ev({ id: 'e1', path: 'src/a.ts', line_start: 9 }), lookup(files, 'abc123'), 'abc123'),
      { ok: false, reason: 'LINE_OUT_OF_RANGE' },
    );
    assert.deepEqual(
      resolveCitation(ev({ id: 'e1', path: 'src/a.ts', revision: 'old' }), lookup(files, 'abc123'), 'abc123'),
      { ok: false, reason: 'REVISION_MISMATCH' },
    );
    assert.deepEqual(
      resolveCitation(ev({ id: 'e1', path: 'src/a.ts', is_stale: true }), lookup(files, 'abc123'), 'abc123'),
      { ok: false, reason: 'STALE' },
    );
  });

  it('rejects forged E1 pointers without a path', () => {
    const r = resolveCitation(ev({ id: 'e9' }), () => null, 'abc123');
    assert.deepEqual(r, { ok: false, reason: 'UNKNOWN_PATH' });
  });
});

describe('adjudicator', () => {
  const cov = { examined_files: 5, relevant_files: 5, gaps: [] as string[], negative_search_sufficient: true };
  const base: ProposedVerdict = {
    criterion_id: 'c1',
    finding: 'supported',
    evidence: [],
    coverage: cov,
    confidence: 0.9,
    rationale: 'implemented',
    missing_proof: [],
  };

  it('no evidence → not_established', () => {
    const r = adjudicate(base, new Map());
    assert.equal(r.finding, 'not_established');
  });

  it('failed citation on a positive claim → not_established', () => {
    const e = ev({ id: 'e1', path: 'src/a.ts' });
    const r = adjudicate({ ...base, evidence: [e] }, new Map([['e1', false]]));
    assert.equal(r.finding, 'not_established');
    assert.ok(r.reasons.length > 0);
  });

  it('E0-only positive claim → not_established', () => {
    const e = ev({ id: 'e1', tier: 'E0_claim', description: 'a comment says it works' });
    const r = adjudicate({ ...base, evidence: [e] }, new Map([['e1', true]]));
    assert.equal(r.finding, 'not_established');
  });

  it('contradiction without incompatible evidence → not_established', () => {
    const e = ev({ id: 'e1', description: 'some related code' });
    const r = adjudicate({ ...base, finding: 'contradicted', evidence: [e] }, new Map([['e1', true]]));
    assert.equal(r.finding, 'not_established');
  });

  it('absence claim without exhaustive scope → not_established', () => {
    const e = ev({ id: 'e1', description: 'searched two files' });
    const r = adjudicate(
      { ...base, rationale: 'no such endpoint exists anywhere', coverage: { ...cov, negative_search_sufficient: false }, evidence: [e] },
      new Map([['e1', true]]),
    );
    assert.equal(r.finding, 'not_established');
  });

  it('valid E1 evidence keeps supported and reports grade', () => {
    const e = ev({ id: 'e1', path: 'src/a.ts', line_start: 1 });
    const r = adjudicate({ ...base, evidence: [e] }, new Map([['e1', true]]));
    assert.equal(r.finding, 'supported');
    assert.equal(r.grade, 'E1_source');
  });

  it('E1 evidence cannot satisfy a higher required tier (source is not runtime proof)', () => {
    const e = ev({ id: 'e1', path: 'src/a.ts', line_start: 1 });
    const r = adjudicate({ ...base, evidence: [e] }, new Map([['e1', true]]), { requiresTier: 'E3_runtime' });
    assert.equal(r.finding, 'not_established');
    assert.ok(r.reasons.some((m) => m.includes('E3_runtime')));
  });

  it('exhaustive negative absence keeps supported with no evidence', () => {
    const r = adjudicate(
      { ...base, evidence: [] },
      new Map(),
      { exhaustiveNegative: true },
    );
    assert.equal(r.finding, 'supported');
  });

  it('exhaustiveNegative never rescues a positive claim', () => {
    const r = adjudicate(
      { ...base, finding: 'partial', evidence: [] },
      new Map(),
      { exhaustiveNegative: true },
    );
    assert.equal(r.finding, 'not_established');
  });
});

describe('correction packs and change risk', () => {
  it('rejects unbounded or finding-free packs', () => {
    const common = {
      id: 'p1', project_id: 'p', target_revision: 'r', diagnosis_hypotheses: ['h'],
      evidence_ids: ['e1'], instructions: 'Fix it. Then re-run verification and report.',
      acceptance_commands: ['npm test'], unknowns: ['u'], created_at: '2026-10-27T12:00:00.000Z',
    };
    assert.equal(buildCorrectionPack({ ...common, finding_ids: [], proposed_change_scope: ['src/'], do_not_touch: [] }).ok, false);
    assert.equal(buildCorrectionPack({ ...common, finding_ids: ['f1'], proposed_change_scope: [], do_not_touch: [] }).ok, false);
    const good = buildCorrectionPack({ ...common, finding_ids: ['f1'], proposed_change_scope: ['src/'], do_not_touch: ['src/auth/'] });
    assert.equal(good.ok, true);
  });

  it('flags auth and test paths as sensitive', () => {
    assert.equal(riskForPath('src/auth/middleware.ts').risk, 'critical');
    assert.equal(riskForPath('src/x.test.ts').risk, 'high');
    assert.deepEqual(riskForPath('src/referral.ts'), { risk: 'low', flags: [] });
  });

  it('flags Python test conventions as test files (parity with JS)', () => {
    for (const p of ['tests/test_referral.py', 'src/test_auth.py', 'src/referral_test.py', 'tests/conftest.py']) {
      const r = riskForPath(p);
      assert.equal(r.risk, 'high', p);
      assert.ok(r.flags.includes('test_file_touched'), p);
    }
    // Near-misses must NOT match: contest.py, latest.py, protested.js.
    for (const p of ['src/contest.py', 'src/latest.py', 'src/protested.js']) {
      assert.equal(riskForPath(p).risk, 'low', p);
    }
  });
});

describe('learning types', () => {
  const quiz: QuizItem = {
    id: 'q1',
    project_id: 'p',
    revision: 'abc',
    criterion_ids: ['c1'],
    type: 'locate',
    prompt: 'Where is expiry implemented?',
    rubric: ['src/referral.js#L1-L5'],
    evidence_ids: ['e1'],
    difficulty: 1,
    status: 'draft',
  };
  const evidence = [{ id: 'e1', path: 'src/referral.js', line_start: 1, line_end: 5 }];

  it('validates quiz payloads at trust boundaries', () => {
    assert.equal(validateQuizItem(quiz).ok, true);
    assert.equal(validateQuizItem({ ...quiz, rubric: [] }).ok, false);
    assert.equal(validateQuizItem({ ...quiz, type: 'guess' }).ok, false);
  });

  it('grades locate answers on file plus overlapping range', () => {
    assert.equal(gradeLocate(quiz, 'src/referral.js lines 2-4', evidence), 'pass');
    assert.equal(gradeLocate(quiz, 'referral.js', evidence), 'pass');
    assert.equal(gradeLocate(quiz, 'src/auth.js lines 1-2', evidence), 'fail');
    assert.equal(gradeLocate(quiz, 'src/referral.js lines 40-50', evidence), 'fail');
    assert.equal(gradeLocate(quiz, 'somewhere', evidence), 'fail');
  });
});
