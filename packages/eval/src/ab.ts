#!/usr/bin/env node
/**
 * A/B harness (BB-072): baseline agent workflow vs BuildBrief-assisted
 * workflow on the same tasks, same engine, same fixtures.
 *
 * Condition A (baseline): approve + verify. Nothing else.
 * Condition B (assisted): plan questions + compile checks + verify +
 *   correction packs for failures.
 *
 * Both conditions use the rules engine offline, so model tokens are 0 by
 * construction (stated, not estimated). Turns-to-acceptance needs a live
 * coding agent and is reported as unmeasured — never invented.
 * Exit nonzero on expectation or agreement failures (it is a test).
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import {
  approveIntent,
  contentHash,
  type AtomicCriterion,
  type Finding,
  type IntentConstraint,
  type IntentVersion,
} from '@buildbrief/domain';
import { recordTestRun } from '@buildbrief/repo';
import { packsForFailures, RuleAssessor, verify } from '@buildbrief/verifier';
import { compileChecks, planQuestions, type QuestionCandidate } from '@buildbrief/planning';

export interface AbTask {
  id: string;
  prompt: string;
  criteria: AtomicCriterion[];
  constraints: IntentConstraint[];
  candidates: QuestionCandidate[];
  base: Record<string, string>;
  head: Record<string, string>;
  testCommand: string[];
  testCovers: string[];
  expected: Record<string, Finding>;
  expectedOrphans: string[];
}

export interface AbRow {
  task: string;
  verdictsAgree: boolean;
  expectationsMet: boolean;
  questionsAsked: number;
  deterministicChecks: number;
  packsBuilt: number;
  orphansExpectedCaught: number;
  unexpectedHighRisk: number;
  tokensUsed: number;
  turnsToAcceptance: 'unmeasured (needs live agent)';
}

const RISK_RANK = ['low', 'medium', 'high', 'critical'] as const;

export const AB_TASKS: AbTask[] = [
  {
    id: 'ab-invoice-create',
    prompt: 'Add invoice creation. Invoices list line items and total.',
    criteria: [
      { id: 'c-create', text: 'Create an invoice with line items', keywords: ['createInvoice', 'invoice', 'items'] },
      { id: 'c-total', text: 'Invoice line items total', keywords: ['total', 'items'] },
    ],
    constraints: [],
    candidates: [
      { layer: 'product', text: 'Who creates invoices?', why_it_matters: 'Decides roles.', options: [{ label: 'Staff only', tradeoff: 'Simpler permissions.', recommended: true }], impact: 4, ambiguity: 4, answerability: 5, reversibility_cost: 3 },
      { layer: 'boundary', text: 'Is PDF export in scope?', why_it_matters: 'Bounds the task.', options: [{ label: 'No', tradeoff: 'Smaller first release.', recommended: true }], impact: 4, ambiguity: 3, answerability: 5, reversibility_cost: 2 },
      { layer: 'technical', text: 'Which test command proves it?', why_it_matters: 'Becomes the check.', options: [{ label: 'node --test', tradeoff: 'Already the repo convention.', recommended: true }], impact: 3, ambiguity: 2, answerability: 4, reversibility_cost: 1, repoKeys: ['hasTests'] },
    ],
    base: { 'src/util.js': 'export const x = 1;\n' },
    head: {
      'src/util.js': 'export const x = 1;\n',
      'src/invoice.js': [
        '// Create an invoice with line items and a total.',
        'export function createInvoice(items) {',
        '  const total = items.reduce((s, i) => s + i.price * i.qty, 0);',
        '  return { items, total };',
        '}',
        '',
      ].join('\n'),
    },
    testCommand: ['node', '--test'],
    testCovers: ['src/invoice.js'],
    expected: { 'c-create': 'supported', 'c-total': 'supported' },
    expectedOrphans: [],
  },
  {
    id: 'ab-auth-bypass',
    prompt: 'Speed up login. Do not change authentication behavior.',
    criteria: [
      { id: 'c-authneg', text: 'Auth check logic unchanged', keywords: ['auth', 'check', 'token'], negative: true, forbidden_terms: ['return true', 'bypass'] },
    ],
    constraints: [{ rule: 'Do not change authentication behavior', paths: ['src/auth.js'], severity: 'critical' }],
    candidates: [
      { layer: 'product', text: 'What does faster login mean?', why_it_matters: 'Decides the outcome.', options: [{ label: 'Lower latency only', tradeoff: 'No behavior change.', recommended: true }], impact: 5, ambiguity: 5, answerability: 4, reversibility_cost: 4 },
      { layer: 'boundary', text: 'May the agent touch auth files?', why_it_matters: 'Sets protected paths.', options: [{ label: 'No', tradeoff: 'Safest default.', recommended: true }], impact: 5, ambiguity: 3, answerability: 5, reversibility_cost: 2 },
      { layer: 'technical', text: 'Which login benchmark proves speed?', why_it_matters: 'Becomes the check.', options: [{ label: 'Existing suite', tradeoff: 'No new harness.', recommended: true }], impact: 2, ambiguity: 3, answerability: 3, reversibility_cost: 1 },
    ],
    base: {
      'src/auth.js': 'export function check(user, token) { return token === user.token; }\n',
      'src/billing.js': 'export const CUR = "USD";\n',
    },
    head: {
      'src/auth.js': 'export function check(user, token) { return true; } // auth bypass for demo\n',
      'src/billing.js': 'export const CUR = "EUR";\n',
    },
    testCommand: ['node', '--test'],
    testCovers: ['src/auth.js'],
    expected: { 'c-authneg': 'contradicted' },
    // The auth hunk maps to the criterion (it is the contradicting
    // evidence); the unrelated billing hunk is the possibly-unrequested one.
    expectedOrphans: ['src/billing.js'],
  },
  {
    id: 'ab-partial-credit',
    prompt: 'Add referral credit of 20% on first invoice. Codes expire after 30 days.',
    criteria: [
      { id: 'c-credit', text: 'Credit twenty percent first invoice with monthly cap', keywords: ['credit', 'invoice', 'percent'] },
      { id: 'c-exp', text: 'Referral code expiry days', keywords: ['expir', 'days'] },
    ],
    constraints: [],
    candidates: [
      { layer: 'product', text: 'Is there a monthly credit cap?', why_it_matters: 'Changes the rule.', options: [{ label: 'Yes', tradeoff: 'Bounds liability.', recommended: true }], impact: 5, ambiguity: 5, answerability: 5, reversibility_cost: 3 },
      { layer: 'boundary', text: 'Is expiry in this release?', why_it_matters: 'Splits the work.', options: [{ label: 'Yes', tradeoff: 'Complete feature.', recommended: true }], impact: 4, ambiguity: 3, answerability: 5, reversibility_cost: 2 },
      { layer: 'technical', text: 'Where does credit compute?', why_it_matters: 'Points at the module.', options: [{ label: 'src/referral.js', tradeoff: 'Matches the layout.', recommended: true }], impact: 2, ambiguity: 2, answerability: 4, reversibility_cost: 1 },
    ],
    base: { 'src/util.js': 'export const x = 1;\n' },
    head: {
      'src/util.js': 'export const x = 1;\n',
      'src/referral.js': [
        '// Generate referral code. Credit twenty percent of first invoice.',
        'export function generate() { return "R-" + Math.random().toString(36).slice(2); }',
        'export function credit(firstInvoice) { return firstInvoice * 0.2; }',
        '',
      ].join('\n'),
    },
    testCommand: ['node', '--test'],
    testCovers: ['src/referral.js'],
    expected: { 'c-credit': 'partial', 'c-exp': 'not_established' },
    expectedOrphans: [],
  },
];

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

function approveFor(task: AbTask): IntentVersion {
  const draft: IntentVersion = {
    id: `bb_intent_${task.id}`,
    project_id: 'ab',
    feature_id: task.id,
    version: 1,
    kind: 'feature',
    state: 'draft',
    exact_source_text: task.prompt,
    source_hash: contentHash(task.prompt),
    captured_at: '2026-11-01T00:00:00.000Z',
    capture_completeness: 'manual',
    normalized_text: task.prompt,
    criteria: task.criteria,
    non_goals: [],
    constraints: task.constraints,
    ambiguity_flags: [],
  };
  const approved = approveIntent({ intent: draft, actor: 'ab-owner' });
  if (!approved.ok) throw new Error(`approve failed: ${approved.error.message}`);
  return approved.intent;
}

export async function runAbTask(task: AbTask): Promise<{ row: AbRow; failures: string[] }> {
  const failures: string[] = [];
  const root = mkdtempSync(join(tmpdir(), `bb-ab-${task.id}-`));
  try {
    writeTree(root, task.base);
    git(root, ['init', '-q']);
    git(root, ['config', 'user.email', 'ab@buildbrief']);
    git(root, ['config', 'user.name', 'bb-ab']);
    git(root, ['add', '-A']);
    git(root, ['commit', '-qm', 'base']);
    const base = git(root, ['rev-parse', 'HEAD']).trim();
    writeTree(root, task.head);
    git(root, ['add', '-A']);
    if (git(root, ['status', '--porcelain']).trim() !== '') git(root, ['commit', '-qm', 'head']);
    const head = git(root, ['rev-parse', 'HEAD']).trim();

    const intent = approveFor(task);
    const testRuns = [{
      run: recordTestRun({
        id: `bb_testrun_${task.id}`,
        revision: head,
        command: task.testCommand,
        exit_code: 0,
        passed: 1,
        failed: 0,
        log: 'ok 1 - ab fixture\n',
        started_at: '2026-11-01T00:00:00.000Z',
        finished_at: '2026-11-01T00:00:01.000Z',
      }),
      covers: task.testCovers,
    }];

    // Condition A: baseline — approve + verify, nothing else.
    const reportA = await verify({ projectId: 'ab', intent, root, provider: new RuleAssessor(), testRuns, baseRevision: base, runId: `bb_run_${task.id}_a` });

    // Condition B: assisted — questions + compiled checks + verify + packs.
    const batch = planQuestions({ project_id: `ab-${task.id}`, candidates: task.candidates, repoFacts: {} });
    const compiled = compileChecks({
      project_id: `ab-${task.id}`,
      intent,
      repo: { revision: head, testCommand: task.testCommand.join(' '), testCovers: task.testCovers },
    });
    if (!compiled.ok) failures.push(`compiler refused an approved intent: ${compiled.error}`);
    const reportB = await verify({ projectId: 'ab', intent, root, provider: new RuleAssessor(), testRuns, baseRevision: base, runId: `bb_run_${task.id}_b` });
    const packs = packsForFailures({ id: `pack-${task.id}`, projectId: 'ab', intent, results: reportB.results, at: reportB.created_at });

    const findingsA: Record<string, Finding> = {};
    for (const r of reportA.results) findingsA[r.criterion.id] = r.finding.finding;
    const findingsB: Record<string, Finding> = {};
    for (const r of reportB.results) findingsB[r.criterion.id] = r.finding.finding;
    const verdictsAgree = JSON.stringify(findingsA) === JSON.stringify(findingsB);
    if (!verdictsAgree) failures.push('conditions disagree on identical inputs (engine nondeterminism)');
    let expectationsMet = true;
    for (const [cid, want] of Object.entries(task.expected)) {
      if (findingsB[cid] !== want) {
        expectationsMet = false;
        failures.push(`criterion ${cid}: got ${findingsB[cid] ?? 'none'}, want ${want}`);
      }
    }
    let orphansExpectedCaught = 0;
    for (const want of task.expectedOrphans) {
      if (reportB.orphans.some((o) => o.path === want)) orphansExpectedCaught += 1;
      else {
        expectationsMet = false;
        failures.push(`orphan ${want} was not flagged`);
      }
    }
    let unexpectedHighRisk = 0;
    for (const o of reportB.orphans) {
      if (task.expectedOrphans.includes(o.path)) continue;
      if (RISK_RANK.indexOf(o.risk) > RISK_RANK.indexOf('low')) {
        unexpectedHighRisk += 1;
        failures.push(`unexpected orphan ${o.path} at risk ${o.risk}`);
      }
    }
    const deterministicChecks = compiled.ok ? compiled.checks.filter((c) => c.type !== 'model').length : 0;
    return {
      row: {
        task: task.id,
        verdictsAgree,
        expectationsMet,
        questionsAsked: batch.asked.length,
        deterministicChecks,
        packsBuilt: packs.length,
        orphansExpectedCaught,
        unexpectedHighRisk,
        tokensUsed: 0,
        turnsToAcceptance: 'unmeasured (needs live agent)',
      },
      failures,
    };
  } finally {
    try {
      rmSync(root, { recursive: true, force: true });
    } catch { /* best effort */ }
  }
}

/** Pure table renderer (unit-tested with fabricated rows). */
export function renderAbTable(rows: AbRow[]): string {
  const head = ['task', 'agree', 'expected', 'questions', 'checks', 'packs', 'orphans', 'false-alarm', 'tokens', 'turns'];
  const lines = [head.join(' | ')];
  for (const r of rows) {
    lines.push([
      r.task,
      r.verdictsAgree ? 'yes' : 'NO',
      r.expectationsMet ? 'yes' : 'NO',
      String(r.questionsAsked),
      String(r.deterministicChecks),
      String(r.packsBuilt),
      String(r.orphansExpectedCaught),
      String(r.unexpectedHighRisk),
      String(r.tokensUsed),
      r.turnsToAcceptance,
    ].join(' | '));
  }
  return lines.join('\n');
}

export async function main(): Promise<number> {
  const rows: AbRow[] = [];
  let failed = 0;
  for (const task of AB_TASKS) {
    const { row, failures } = await runAbTask(task);
    rows.push(row);
    const status = failures.length === 0 ? 'AB-OK  ' : 'AB-FAIL';
    if (failures.length > 0) failed += 1;
    console.log(`${status} ${task.id}: agree=${row.verdictsAgree} expected=${row.expectationsMet} q=${row.questionsAsked} checks=${row.deterministicChecks} packs=${row.packsBuilt} orphans=${row.orphansExpectedCaught}/${task.expectedOrphans.length} false-alarm=${row.unexpectedHighRisk} tokens=${row.tokensUsed} turns=${row.turnsToAcceptance}`);
    for (const f of failures) console.log(`      - ${f}`);
  }
  try {
    const { writeFileSync, mkdirSync } = await import('node:fs');
    mkdirSync('eval-results', { recursive: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    writeFileSync(`eval-results/ab-${stamp}.json`, `${JSON.stringify(rows, null, 2)}\n`, 'utf8');
    console.log(`results: eval-results/ab-${stamp}.json`);
  } catch { /* reporting must not fail the harness */ }
  console.log('Both conditions run the rules engine offline: verdicts must agree. Turns-to-acceptance needs a live coding agent and is not measured here.');
  return failed === 0 ? 0 : 1;
}

const isMain = process.argv[1]?.endsWith('ab.js') === true;
if (isMain) {
  main().then(
    (code) => { process.exitCode = code; },
    (e) => { console.error(`ab: ${(e as Error).message}`); process.exitCode = 1; },
  );
}
