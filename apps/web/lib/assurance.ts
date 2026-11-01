import type { VerificationReport } from '@buildbrief/verifier';

export interface ReportSummary {
  criteria: number;
  supported: number;
  partial: number;
  contradicted: number;
  unproven: number;
  evidence: number;
  /** Distinct cited source files. */
  files: string[];
  staleEvidence: number;
  orphans: number;
  testRuns: { command: string; exit: number; passed: number; failed: number }[];
  coverageGaps: string[];
  provider: string;
  model: string;
  revision: string;
  createdAt: string;
}

/**
 * Counts-only summary of one verification report. No rates, no guessed
 * scores — every number traces to the stored report.
 */
export function summarizeReport(report: VerificationReport): ReportSummary {
  let supported = 0;
  let partial = 0;
  let contradicted = 0;
  let unproven = 0;
  let evidence = 0;
  let staleEvidence = 0;
  const files = new Set<string>();
  const coverageGaps = new Set<string>();
  for (const result of report.results) {
    const verdict = result.finding.finding;
    if (verdict === 'supported') supported += 1;
    else if (verdict === 'partial') partial += 1;
    else if (verdict === 'contradicted') contradicted += 1;
    else unproven += 1;
    evidence += result.evidence.length;
    for (const pointer of result.evidence) {
      if (pointer.path !== undefined) files.add(pointer.path);
      if (pointer.is_stale) staleEvidence += 1;
    }
    for (const gap of result.finding.coverage.gaps) coverageGaps.add(gap);
  }
  return {
    criteria: report.results.length,
    supported,
    partial,
    contradicted,
    unproven,
    evidence,
    files: [...files].sort(),
    staleEvidence,
    orphans: report.orphans.length,
    testRuns: report.test_runs.map((t) => ({
      command: t.run.command.join(' '),
      exit: t.run.exit_code,
      passed: t.run.passed,
      failed: t.run.failed,
    })),
    coverageGaps: [...coverageGaps].sort(),
    provider: report.provider,
    model: report.model,
    revision: report.checked_revision,
    createdAt: report.created_at,
  };
}

export interface ReadinessInput {
  intents: { id: string; feature_id: string; state: string }[];
  findings: { requirement_version_id: string; run_id: string; finding: string; stale: boolean }[];
  runs: { id: string; intent: string }[];
  latestRunIds: string[];
  gates: { session_id: string; loops: number; disposition: string }[];
}

export type ReadinessStatus = 'established' | 'attention' | 'stale' | 'never-run' | 'draft';

export interface ReadinessRow {
  intent_id: string;
  feature: string;
  status: ReadinessStatus;
  run_id: string | null;
  unresolved: number;
}

/**
 * Per-feature release readiness from stored runs only. No run, no claim:
 * unapproved work is draft, approved-but-unchecked work is never-run, and
 * anything stale says so.
 */
export function readinessSummary(input: ReadinessInput): { rows: ReadinessRow[]; openGates: number } {
  const rows = input.intents.map((intent) => {
    if (intent.state !== 'approved') {
      return { intent_id: intent.id, feature: intent.feature_id, status: 'draft' as ReadinessStatus, run_id: null, unresolved: 0 };
    }
    const run = input.runs.find((r) => r.intent === intent.id) ?? null;
    if (run === null) {
      return { intent_id: intent.id, feature: intent.feature_id, status: 'never-run' as ReadinessStatus, run_id: null, unresolved: 0 };
    }
    const mine = input.findings.filter((f) => f.requirement_version_id === intent.id && f.run_id === run.id);
    const unresolved = mine.filter((f) => f.finding !== 'supported').length;
    const stale = mine.some((f) => f.stale);
    const status: ReadinessStatus = stale ? 'stale' : unresolved > 0 ? 'attention' : 'established';
    return { intent_id: intent.id, feature: intent.feature_id, status, run_id: run.id, unresolved };
  });
  const openGates = input.gates.filter((g) => g.disposition === 'blocked_deterministic').length;
  return { rows, openGates };
}

export interface AttentionInput {
  orphans: { id: string; path: string; disposition?: string }[];
  findings: { id: string; run_id: string; stale: boolean }[];
  latestRunIds: string[];
  gates: { session_id: string; loops: number; disposition: string }[];
}

export interface AttentionSummary {
  pendingOrphans: { id: string; path: string }[];
  staleFindings: { id: string; run_id: string }[];
  openGates: { session_id: string; loops: number }[];
}

/**
 * What waits for the owner: unreviewed changes, stale checks, open gates.
 * Findings already sit in the workspace queue; this covers the rest.
 */
export function attentionSummary(input: AttentionInput): AttentionSummary {
  const latest = new Set(input.latestRunIds);
  return {
    pendingOrphans: input.orphans
      .filter((o) => o.disposition === undefined || o.disposition === 'pending')
      .map((o) => ({ id: o.id, path: o.path })),
    staleFindings: input.findings
      .filter((f) => f.stale && latest.has(f.run_id))
      .map((f) => ({ id: f.id, run_id: f.run_id })),
    openGates: input.gates
      .filter((g) => g.disposition === 'blocked_deterministic')
      .map((g) => ({ session_id: g.session_id, loops: g.loops })),
  };
}
