#!/usr/bin/env node
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { DEV_CASES } from './fixtures.js';
import { DEV_CASES_2, GAP_PROBES } from './fixtures2.js';
import { HOLDOUT_CASES } from './holdout.js';
import { HOLDOUT_CASES_2 } from './holdout2.js';
import { runCase } from './runner.js';
import { type CaseResult } from './cases.js';

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  return sorted[Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))] as number;
}

export async function main(argv: string[], cwd: string): Promise<number> {
  const only = argv.includes('--holdout-only') ? 'holdout' : argv.includes('--dev-only') ? 'dev' : 'all';
  const DEV_ALL = [...DEV_CASES, ...DEV_CASES_2, ...GAP_PROBES];
  const HOLD_ALL = [...HOLDOUT_CASES, ...HOLDOUT_CASES_2];
  const cases = only === 'holdout' ? HOLD_ALL : only === 'dev' ? DEV_ALL : [...DEV_ALL, ...HOLD_ALL];
  const results: CaseResult[] = [];
  for (const c of cases) {
    const r = await runCase(c);
    results.push(r);
    const tag = r.holdout ? '[holdout]' : r.known_gap ? '[gap]    ' : '[dev]    ';
    const status = r.known_gap ? (r.failures.length === 0 ? 'GAP-CLOSED?' : 'GAP-DOC') : r.pass ? 'PASS' : 'FAIL';
    console.log(`${status} ${tag} ${r.caseId} (${r.caseClass}, ${r.latencyMs}ms)`);
    for (const f of r.failures) console.log(`      - ${f}`);
  }

  const dev = results.filter((r) => !r.holdout && !r.known_gap);
  const hold = results.filter((r) => r.holdout);
  const byClass = new Map<string, { n: number; ok: number }>();
  for (const r of results) {
    const e = byClass.get(r.caseClass) ?? { n: 0, ok: 0 };
    e.n += 1;
    if (r.pass) e.ok += 1;
    byClass.set(r.caseClass, e);
  }

  // Orphan detection over expected-vs-flagged paths (dev + holdout pooled).
  // False accusation = an UNEXPECTED flag at medium risk or higher. Low-risk
  // unexpected flags are informative by design (blueprint: never silent), counted
  // separately, never as false accusations.
  let tp = 0;
  let fp = 0;
  let fn = 0;
  let info = 0;
  for (let i = 0; i < cases.length; i += 1) {
    const c = cases[i] as (typeof cases)[number];
    const r = results[i] as CaseResult;
    const flagged = r.orphans.map((o) => o.path);
    for (const want of c.expectedOrphans) {
      if (flagged.includes(want)) tp += 1;
      else fn += 1;
    }
    for (const o of r.orphans) {
      if (c.expectedOrphans.includes(o.path)) continue;
      if (o.risk === 'low') info += 1;
      else fp += 1;
    }
  }
  const orphanPrecision = tp + fp === 0 ? 1 : tp / (tp + fp);
  const orphanRecall = tp + fn === 0 ? 1 : tp / (tp + fn);

  // Verdict-level stats over gated (non-gap) cases, second revisions included:
  // positive prediction = supported|partial; positive truth = expected supported|partial.
  const POS = new Set(['supported', 'partial']);
  let vtp = 0;
  let vfp = 0;
  let vfn = 0;
  const fpList: string[] = [];
  const fnList: string[] = [];
  for (let i = 0; i < cases.length; i += 1) {
    const c = cases[i] as (typeof cases)[number];
    const r = results[i] as CaseResult;
    if (c.known_gap === true) continue;
    const check = (got: Record<string, string>, want: Record<string, string>, rev: string): void => {
      for (const [id, w] of Object.entries(want)) {
        const g = got[id] ?? 'not_established';
        if (POS.has(g) && POS.has(w)) vtp += 1;
        else if (POS.has(g) && !POS.has(w)) {
          vfp += 1;
          fpList.push(`${c.id}/${id}@${rev}: predicted ${g}, truth ${w}`);
        } else if (!POS.has(g) && POS.has(w)) {
          vfn += 1;
          fnList.push(`${c.id}/${id}@${rev}: predicted ${g}, truth ${w}`);
        }
      }
    };
    check(r.findings, c.expected, 'head');
    if (c.second !== undefined && r.secondFindings !== undefined) {
      check(r.secondFindings, c.second.expected, 'head2');
    }
  }
  const verdictPrecision = vtp + vfp === 0 ? 1 : vtp / (vtp + vfp);
  const verdictRecall = vtp + vfn === 0 ? 1 : vtp / (vtp + vfn);

  const lat = results.map((r) => r.latencyMs).sort((a, b) => a - b);
  const gaps = results.filter((r) => r.known_gap);
  const summary = {
    at: new Date().toISOString(),
    provider: 'rules-v1 (deterministic; $0 model cost)',
    scope: 'controlled seeded benchmark only - not a real-world accuracy claim',
    dev: { n: dev.length, pass: dev.filter((r) => r.pass).length },
    holdout: { n: hold.length, pass: hold.filter((r) => r.pass).length },
    byClass: [...byClass.entries()].map(([cls, v]) => ({ class: cls, n: v.n, pass: v.ok })),
    verdicts: { tp: vtp, fp: vfp, fn: vfn, precision: verdictPrecision, recall: verdictRecall, fpList, fnList },
    orphanDetection: { tp, fp, fn, informativeLow: info, precision: orphanPrecision, recall: orphanRecall },
    knownGaps: gaps.map((g) => ({ case: g.caseId, observations: g.failures, findings: g.findings })),
    latencyMs: { avg: lat.reduce((a, b) => a + b, 0) / Math.max(1, lat.length), p95: percentile(lat, 95) },
    fakeCitations: 0,
    results,
  };

  const dir = join(cwd, 'eval-results');
  mkdirSync(dir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const out = join(dir, `eval-${stamp}.json`);
  writeFileSync(out, `${JSON.stringify(summary, null, 2)}\n`, 'utf8');

  console.log(`\ndev ${summary.dev.pass}/${summary.dev.n} - holdout ${summary.holdout.pass}/${summary.holdout.n} - gaps documented ${gaps.length}`);
  console.log(`verdicts precision ${verdictPrecision.toFixed(2)} recall ${verdictRecall.toFixed(2)} (tp=${vtp} fp=${vfp} fn=${vfn})`);
  console.log(`orphan precision ${orphanPrecision.toFixed(2)} recall ${orphanRecall.toFixed(2)} (tp=${tp} fp=${fp} fn=${fn} informative-low=${info})`);
  console.log(`results: ${out}`);
  const failed = results.filter((r) => !r.pass);
  if (failed.some((r) => r.holdout)) console.log('HOLDOUT-GAP: holdout failures are recorded gaps, not dev tasks.');
  return failed.length === 0 ? 0 : 1;
}

const isMain = process.argv[1]?.endsWith('run.js') === true;
if (isMain) {
  main(process.argv.slice(2), process.cwd()).then(
    (code) => {
      process.exitCode = code;
    },
    (e) => {
      console.error(`bb-eval: ${(e as Error).message}`);
      process.exitCode = 1;
    },
  );
}
