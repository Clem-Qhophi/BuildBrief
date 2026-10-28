#!/usr/bin/env node
// Builds the labeled referral demo: v1 base + v2 faulty feature commits,
// then capture -> approve -> verify in a scratch ledger.
// v1/v2/v3 are SEEDED test conditions, not organic agent output.
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync } from 'node:fs';
import { dirname, join, parse, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { homedir } from 'node:os';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const cli = join(root, 'packages', 'cli', 'dist', 'src', 'main.js');
const [ledgerDir, repoDir, project = 'demo'] = process.argv.slice(2);
if (ledgerDir === undefined || repoDir === undefined) {
  console.error('usage: node samples/demo-seed.mjs <ledger-dir> <repo-dir> [project]');
  process.exit(1);
}
const ledger = resolve(ledgerDir);
const repo = resolve(repoDir);

/**
 * Destructive guard: this script deletes and recreates both target dirs.
 * Refuse filesystem roots, home, the app repo itself, equal paths, nesting,
 * and non-empty dirs that are not recognizably ours (a prior seed).
 */
function assertSafeScratchDir(dir, label) {
  const normalized = resolve(dir);
  const { root } = parse(normalized);
  if (normalized === root) throw new Error(`${label}: refusing filesystem root ${normalized}`);
  if (normalized === resolve(homedir())) throw new Error(`${label}: refusing home directory`);
  if (normalized === root0) throw new Error(`${label}: refusing the BuildBrief repo itself`);
  if (normalized.startsWith(`${root0}/`) || normalized.startsWith(`${root0}\\`)) {
    // Inside the app repo only the ignored scratch dir is acceptable.
    if (!normalized.startsWith(join(root0, '.demo-tmp'))) {
      throw new Error(`${label}: refusing ${normalized} inside the app repo (only .demo-tmp is acceptable)`);
    }
  }
  if (!existsSync(normalized)) return;
  if (!statSync(normalized).isDirectory()) throw new Error(`${label}: ${normalized} is not a directory`);
  const entries = readdirSync(normalized);
  const ours = entries.some((e) => e === '.buildbrief' || e === '.git');
  if (entries.length > 0 && !ours) {
    throw new Error(`${label}: ${normalized} is non-empty and not a prior seed (no .buildbrief/.git) — pick an empty dir`);
  }
}
const root0 = root;
assertSafeScratchDir(ledger, 'ledger');
assertSafeScratchDir(repo, 'repo');
if (ledger === repo) throw new Error('ledger and repo dirs must differ');
if (ledger.startsWith(`${repo}/`) || ledger.startsWith(`${repo}\\`) || repo.startsWith(`${ledger}/`) || repo.startsWith(`${ledger}\\`)) {
  throw new Error('ledger and repo dirs must not nest');
}

function git(args) {
  return execFileSync('git', args, { cwd: repo, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}
function bb(args) {
  return execFileSync(process.execPath, [cli, ...args], { cwd: ledger, encoding: 'utf8' });
}

rmSync(ledger, { recursive: true, force: true });
rmSync(repo, { recursive: true, force: true });
mkdirSync(ledger, { recursive: true });
mkdirSync(repo, { recursive: true });
cpSync(join(root, 'samples', 'referral-demo', 'v1'), repo, { recursive: true });
git(['init', '-q']);
git(['config', 'user.email', 'demo@buildbrief']);
git(['config', 'user.name', 'bbdemo']);
git(['add', '-A']);
git(['commit', '-qm', 'base']);
const base = git(['rev-parse', 'HEAD']).trim();
cpSync(join(root, 'samples', 'referral-demo', 'v2'), repo, { recursive: true });
git(['add', '-A']);
git(['commit', '-qm', 'feature']);
const head = git(['rev-parse', 'HEAD']).trim();

const captured = bb([
  'capture', '--project', project, '--feature', 'referral',
  '--prompt', 'Add referral codes with 20 percent credit on first invoice. Codes expire after 30 days. Do not modify authentication.',
]);
const intentId = (captured.match(/bb_intent_[0-9a-f]+/) ?? [])[0];
if (intentId === undefined) throw new Error(`capture output unparseable:\n${captured}`);
console.log(captured.trim());
console.log(bb(['approve', '--project', project, '--intent', intentId, '--actor', 'owner']).trim());
console.log(bb(['verify', '--project', project, '--intent', intentId, '--repo', repo, '--base', base]).trim());
console.log(`\nseeded demo ready: project=${project} intent=${intentId} base=${base.slice(0, 7)} head=${head.slice(0, 7)}`);
console.log(`inspect: BB_WORKSPACE=${ledger} npm run web`);
