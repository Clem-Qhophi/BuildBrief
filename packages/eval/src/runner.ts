import { execFileSync } from 'node:child_process';
import { lstatSync, mkdtempSync, mkdirSync, readdirSync, rmSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import {
  approveIntent,
  contentHash,
  type Finding,
  type IntentVersion,
} from '@buildbrief/domain';
import { resolveCitation } from '@buildbrief/domain';
import { lookupFile, recordTestRun, captureSnapshot } from '@buildbrief/repo';
import { packsForFailures, RuleAssessor, verify } from '@buildbrief/verifier';
import { type CaseResult, type EvalCase } from './cases.js';

const RISK_RANK = ['low', 'medium', 'high', 'critical'] as const;

function git(cwd: string, args: string[]): string {
  return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}

function writeTree(root: string, files: Record<string, string>): void {
  for (const [rel, text] of Object.entries(files)) {
    const abs = join(root, rel);
    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync(abs, text, 'utf8');
  }
}

/** Syncs the worktree to exactly `files` (deletes anything else except .git). */
function syncTree(root: string, files: Record<string, string>): void {
  const walkDelete = (dir: string): void => {
    for (const name of readdirSync(dir)) {
      if (name === '.git') continue;
      const abs = join(dir, name);
      const rel = abs.slice(root.length + 1).split('\\').join('/');
      if (lstatSync(abs).isDirectory()) {
        walkDelete(abs);
        continue;
      }
      if (!(rel in files)) unlinkSync(abs);
    }
  };
  walkDelete(root);
  writeTree(root, files);
}

export async function runCase(c: EvalCase): Promise<CaseResult> {
  const started = Date.now();
  const failures: string[] = [];
  const root = mkdtempSync(join(tmpdir(), `bb-eval-${c.id}-`));
  try {
    writeTree(root, c.base);
    git(root, ['init', '-q']);
    git(root, ['config', 'user.email', 'eval@buildbrief']);
    git(root, ['config', 'user.name', 'bb-eval']);
    git(root, ['add', '-A']);
    git(root, ['commit', '-qm', 'base']);
    const base = git(root, ['rev-parse', 'HEAD']).trim();
    writeTree(root, c.head ?? c.base);
    syncTree(root, c.head ?? c.base);
    git(root, ['add', '-A']);
    // Identical head: no new commit (git refuses empty commits); pin to base.
    const dirty = git(root, ['status', '--porcelain']).trim() !== '';
    if (dirty) git(root, ['commit', '-qm', 'head']);
    const head = git(root, ['rev-parse', 'HEAD']).trim();

    const draft: IntentVersion = {
      id: `bb_intent_${c.id}`,
      project_id: 'eval',
      feature_id: c.id,
      version: 1,
      kind: 'feature',
      state: 'draft',
      exact_source_text: c.prompt,
      source_hash: contentHash(c.prompt),
      captured_at: '2026-10-27T00:00:00.000Z',
      capture_completeness: 'manual',
      normalized_text: c.prompt,
      criteria: c.criteria,
      non_goals: [],
      constraints: c.constraints,
      ambiguity_flags: [],
    };
    const approved = approveIntent({ intent: draft, actor: 'eval-owner' });
    if (!approved.ok) throw new Error(`approve failed: ${approved.error.message}`);
    const intent: IntentVersion = { ...approved.intent, effective_from_revision: base };

    const testRuns = (c.testRuns ?? []).map((t, i) => ({
      run: recordTestRun({
        id: `bb_testrun_${c.id}_${i}`,
        revision: head,
        command: t.command,
        exit_code: t.exitCode,
        passed: t.exitCode === 0 ? 1 : 0,
        failed: t.exitCode === 0 ? 0 : 1,
        log: t.exitCode === 0 ? 'ok 1 - eval test\n' : 'not ok 1 - eval test\n',
        started_at: '2026-10-27T00:00:00.000Z',
        finished_at: '2026-10-27T00:00:01.000Z',
      }),
      covers: t.covers,
    }));

    const report = await verify({
      projectId: 'eval',
      intent,
      root,
      provider: new RuleAssessor(),
      testRuns,
      baseRevision: base,
      runId: `bb_run_${c.id}`,
    });

    const findings: Record<string, Finding> = {};
    for (const r of report.results) {
      findings[r.criterion.id] = r.finding.finding;
      const want = c.expected[r.criterion.id];
      if (want !== undefined && r.finding.finding !== want) {
        failures.push(`criterion ${r.criterion.id}: got ${r.finding.finding}, want ${want} :: ${r.finding.rationale}`);
      }
      const wantGrade = c.expectedGrades?.[r.criterion.id];
      if (wantGrade !== undefined && r.finding.evidence_grade !== wantGrade) {
        failures.push(`criterion ${r.criterion.id}: grade ${r.finding.evidence_grade}, want ${wantGrade}`);
      }
      // Every cited pointer must mechanically resolve (no fake citations, ever).
      const snap = captureSnapshot(root);
      for (const e of r.evidence) {
        const check = resolveCitation(e, (p) => lookupFile(snap, root, p), report.checked_revision);
        if (!check.ok) failures.push(`criterion ${r.criterion.id}: citation ${e.id} failed (${check.reason})`);
      }
    }

    const flagged = report.orphans.map((o) => o.path);
    for (const want of c.expectedOrphans) {
      if (!flagged.includes(want)) failures.push(`orphan ${want} was not flagged`);
    }
    const cap = c.maxUnexpectedRisk ?? 'low';
    for (const o of report.orphans) {
      if (!c.expectedOrphans.includes(o.path)) {
        if (RISK_RANK.indexOf(o.risk) > RISK_RANK.indexOf(cap)) {
          failures.push(`unexpected orphan ${o.path} at risk ${o.risk} (cap ${cap})`);
        }
      }
    }

    if ((c.forbiddenInOutput ?? []).length > 0) {
      const packs = packsForFailures({
        id: `pack-${c.id}`, projectId: 'eval', intent, results: report.results, at: report.created_at,
      });
      const blob = JSON.stringify({ findings: report.results.map((r) => r.finding), packs });
      for (const f of c.forbiddenInOutput ?? []) {
        if (blob.includes(f)) failures.push(`forbidden string leaked into output: ${f}`);
      }
    }

    let secondFindings: Record<string, Finding> | undefined;
    if (c.second !== undefined) {
      writeTree(root, c.second.head);
      syncTree(root, c.second.head);
      git(root, ['add', '-A']);
      if (git(root, ['status', '--porcelain']).trim() !== '') git(root, ['commit', '-qm', 'head2']);
      const report2 = await verify({
        projectId: 'eval',
        intent,
        root,
        provider: new RuleAssessor(),
        testRuns,
        baseRevision: base,
        runId: `bb_run_${c.id}_2`,
      });
      secondFindings = {};
      for (const r of report2.results) {
        secondFindings[r.criterion.id] = r.finding.finding;
        const want = c.second.expected[r.criterion.id];
        if (want !== undefined && r.finding.finding !== want) {
          failures.push(`second revision ${r.criterion.id}: got ${r.finding.finding}, want ${want} :: ${r.finding.rationale}`);
        }
      }
    }

    const pass = c.known_gap === true ? true : failures.length === 0;
    return {
      caseId: c.id, caseClass: c.caseClass, holdout: c.holdout, known_gap: c.known_gap === true,
      pass, failures, findings,
      ...(secondFindings !== undefined ? { secondFindings } : {}),
      orphans: report.orphans.map((o) => ({ path: o.path, risk: o.risk, flags: o.flags })),
      latencyMs: Date.now() - started, revision: head,
    };
  } finally {
    try {
      rmSync(root, { recursive: true, force: true });
    } catch { /* best effort */ }
  }
}


