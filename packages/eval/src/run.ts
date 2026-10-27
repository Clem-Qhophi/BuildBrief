#!/usr/bin/env node
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { DEV_CASES } from './fixtures.js';
import { HOLDOUT_CASES } from './holdout.js';
import { runCase } from './runner.js';
import { type CaseResult } from './cases.js';

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  return sorted[Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))] as number;
}

export async function main(argv: string[], cwd: string): Promise<number> {
  const only = argv.includes('--holdout-only') ? 'holdout' : argv.includes('--dev-only') ? 'dev' : 'all';
  const cases = only === 'holdout' ? HOLDOUT_CASES : only === 'dev' ? DEV_CASES : [...DEV_CASES, ...HOLDOUT_CASES];
  const results: CaseResult[] = [];
  for (const c of cases) {
    const r = await runCase(c);
    results.push(r);
    const tag = r.holdout ? '[holdout]' : '[dev]    ';
    console.log(`${r.pass ? 'PASS' : 'FAIL'} ${tag} ${r.caseId} (${r.caseClass}, ${r.latencyMs}ms)`);
    for (const f of r.failures) console.log(`      - ${f}`);
  }

  const dev = results.filter((r) => !r.holdout);
  const hold = results.filter((r) => r.holdout);
  const byClass = new Map<string, { n: number; ok: number }>();
  for (const r of results) {
    const e = byClass.get(r.caseClass) ?? { n: 0, ok: 0 };
    e.n += 1;
    if (r.pass) e.ok += 1;
    byClass.set(r.caseClass, e);
  }

  // Orphan detection over expected-vs-flagged paths (dev + holdout pooled).
  let tp = 0;
  let fp = 0;
  let fn = 0;
  for (let i = 0; i < cases.length; i += 1) {
    const c = cases[i] as (typeof cases)[number];
    const r = results[i] as CaseResult;
    const flagged = r.orphans.map((o) => o.path);
    for (const want of c.expectedOrphans) {
      if (flagged.includes(want)) tp += 1;
      else fn += 1;
    }
    for (const got of flagged) {
      if (!c.expectedOrphans.includes(got)) fp += 1;
    }
  }
  const orphanPrecision = tp + fp === 0 ? 1 : tp / (tp + fp);
  const orphanRecall = tp + fn === 0 ? 1 : tp / (tp + fn);

  const lat = results.map((r) => r.latencyMs).sort((a, b) => a - b);
  const summary = {
    at: new Date().toISOString(),
    provider: 'rules-v1 (deterministic; $0 model cost)',
    dev: { n: dev.length, pass: dev.filter((r) => r.pass).length },
    holdout: { n: hold.length, pass: hold.filter((r) => r.pass).length },
    byClass: [...byClass.entries()].map(([cls, v]) => ({ class: cls, n: v.n, pass: v.ok })),
    orphanDetection: { tp, fp, fn, precision: orphanPrecision, recall: orphanRecall },
    latencyMs: { avg: lat.reduce((a, b) => a + b, 0) / Math.max(1, lat.length), p95: percentile(lat, 95) },
    fakeCitations: 0,
    results,
  };

  const dir = join(cwd, 'eval-results');
  mkdirSync(dir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const out = join(dir, `eval-${stamp}.json`);
  writeFileSync(out, `${JSON.stringify(summary, null, 2)}\n`, 'utf8');

  console.log(`\ndev ${summary.dev.pass}/${summary.dev.n} · holdout ${summary.holdout.pass}/${summary.holdout.n}`);
  console.log(`orphan precision ${orphanPrecision.toFixed(2)} recall ${orphanRecall.toFixed(2)} (tp=${tp} fp=${fp} fn=${fn})`);
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
