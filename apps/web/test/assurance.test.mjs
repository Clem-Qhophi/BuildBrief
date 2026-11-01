import { test } from 'node:test';
import assert from 'node:assert/strict';
import { attentionSummary, readinessSummary, summarizeReport } from '../lib/assurance.ts';

function report() {
  return {
    run_id: 'bb_run_x',
    project_id: 'p',
    requirement_version_id: 'i',
    checked_revision: 'abc123',
    base_revision: null,
    created_at: '2026-11-01T10:00:00.000Z',
    provider: 'rules',
    model: 'rules-v1',
    results: [
      {
        criterion: { id: 'c1', text: 'one', keywords: [] },
        trace: {},
        evidence: [
          { id: 'e1', tier: 'E1_source', revision: 'abc123', path: 'src/a.js', collected_at: '2026-11-01T10:00:00.000Z', is_stale: false, description: 'cite' },
          { id: 'e2', tier: 'E1_source', revision: 'abc123', path: 'src/a.js', collected_at: '2026-11-01T10:00:00.000Z', is_stale: true, description: 'old' },
        ],
        finding: { finding: 'supported', evidence_grade: 'E1_source', coverage: { examined_files: 4, relevant_files: 4, gaps: [], negative_search_sufficient: false } },
        adjudicatorNotes: [],
        droppedEvidenceIds: [],
      },
      {
        criterion: { id: 'c2', text: 'two', keywords: [] },
        trace: {},
        evidence: [],
        finding: { finding: 'not_established', evidence_grade: 'E0_claim', coverage: { examined_files: 1, relevant_files: 6, gaps: ['tests/ not inspected'], negative_search_sufficient: false } },
        adjudicatorNotes: [],
        droppedEvidenceIds: [],
      },
    ],
    orphans: [{ id: 'o1' }],
    summary: {},
    test_runs: [{ run: { id: 't1', command: ['npm', 'test'], exit_code: 1, passed: 2, failed: 3 }, covers: [] }],
  };
}

test('report summary counts verdicts, evidence, files and runs without rates', () => {
  const summary = summarizeReport(report());
  assert.deepEqual(
    { criteria: summary.criteria, supported: summary.supported, unproven: summary.unproven, evidence: summary.evidence },
    { criteria: 2, supported: 1, unproven: 1, evidence: 2 },
  );
  assert.deepEqual(summary.files, ['src/a.js']);
  assert.equal(summary.staleEvidence, 1);
  assert.equal(summary.orphans, 1);
  assert.deepEqual(summary.testRuns, [{ command: 'npm test', exit: 1, passed: 2, failed: 3 }]);
  assert.deepEqual(summary.coverageGaps, ['tests/ not inspected']);
  assert.equal(summary.revision, 'abc123');
});

test('attention summary surfaces orphans, stale checks and open gates', () => {
  const summary = attentionSummary({
    orphans: [
      { id: 'o1', path: 'src/auth.js' },
      { id: 'o2', path: 'src/x.js', disposition: 'explained' },
    ],
    findings: [
      { id: 'f1', run_id: 'r1', stale: true },
      { id: 'f2', run_id: 'rOld', stale: true },
      { id: 'f3', run_id: 'r1', stale: false },
    ],
    latestRunIds: ['r1'],
    gates: [
      { session_id: 's1', loops: 1, disposition: 'blocked_deterministic' },
      { session_id: 's2', loops: 0, disposition: 'advisory' },
    ],
  });
  assert.deepEqual(summary.pendingOrphans, [{ id: 'o1', path: 'src/auth.js' }]);
  assert.deepEqual(summary.staleFindings, [{ id: 'f1', run_id: 'r1' }]);
  assert.deepEqual(summary.openGates, [{ session_id: 's1', loops: 1 }]);
});

test('empty inputs summarise to zeros', () => {
  const summary = summarizeReport({ ...report(), results: [], orphans: [], test_runs: [] });
  assert.equal(summary.criteria, 0);
  assert.deepEqual(summary.files, []);
  assert.deepEqual(attentionSummary({ orphans: [], findings: [], latestRunIds: [], gates: [] }), {
    pendingOrphans: [],
    staleFindings: [],
    openGates: [],
  });
});

test('readiness distinguishes draft, never-run, stale, attention and established', () => {
  const input = {
    intents: [
      { id: 'i-draft', feature_id: 'drafty', state: 'draft' },
      { id: 'i-new', feature_id: 'fresh', state: 'approved' },
      { id: 'i-stale', feature_id: 'old', state: 'approved' },
      { id: 'i-attn', feature_id: 'wobbly', state: 'approved' },
      { id: 'i-ok', feature_id: 'solid', state: 'approved' },
    ],
    findings: [
      { requirement_version_id: 'i-stale', run_id: 'r-stale', finding: 'supported', stale: true },
      { requirement_version_id: 'i-attn', run_id: 'r-attn', finding: 'partial', stale: false },
      { requirement_version_id: 'i-ok', run_id: 'r-ok', finding: 'supported', stale: false },
    ],
    runs: [
      { id: 'r-stale', intent: 'i-stale' },
      { id: 'r-attn', intent: 'i-attn' },
      { id: 'r-ok', intent: 'i-ok' },
    ],
    latestRunIds: ['r-stale', 'r-attn', 'r-ok'],
    gates: [{ session_id: 's1', loops: 2, disposition: 'blocked_deterministic' }],
  };
  const { rows, openGates } = readinessSummary(input);
  const byId = new Map(rows.map((r) => [r.intent_id, r]));
  assert.equal(byId.get('i-draft').status, 'draft');
  assert.equal(byId.get('i-new').status, 'never-run');
  assert.equal(byId.get('i-stale').status, 'stale');
  assert.equal(byId.get('i-attn').status, 'attention');
  assert.equal(byId.get('i-attn').unresolved, 1);
  assert.equal(byId.get('i-ok').status, 'established');
  assert.equal(openGates, 1);
});
