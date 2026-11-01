import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { cpSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve, relative } from 'node:path';
import { approveIntent, extractDraft } from '@buildbrief/domain';
import { appendEvent, openProjectStore, rebuildViews } from '@buildbrief/store';
import { doVerify } from './actions';
import { readConnections, saveConnection } from './connections';

export interface ProbeResult {
  version: 'before' | 'after';
  ageMinutes: number;
  alreadyUsed: boolean;
  allowed: boolean;
  message: string;
  revision: string;
  checkedAt: string;
}
export interface ResetExample {
  project: string;
  scenario: 'reset';
  before: string;
  after: string;
  beforeRevision: string;
  afterRevision: string;
  latestProbe?: ProbeResult;
}

function fixtures() { return resolve(process.cwd(), '..', '..', 'samples', 'reset-demo'); }
function stateFile(root: string, project: string) {
  if (!/^example-reset-[a-f0-9]{8}$/.test(project)) throw new Error('Choose a password recovery example first.');
  return join(root, '.buildbrief', 'example-state', `${project}.json`);
}
export function readResetExample(root: string, project: string): ResetExample | null {
  try {
    const data = JSON.parse(readFileSync(stateFile(root, project), 'utf8')) as ResetExample;
    if (data.project !== project || data.scenario !== 'reset' || !/^[a-f0-9]{40}$/.test(data.beforeRevision) || !/^[a-f0-9]{40}$/.test(data.afterRevision)) return null;
    return data;
  } catch { return null; }
}

/** Execute only the immutable, allowlisted example module, never a user's repo. */
export function probeResetExample(root: string, project: string, version: 'before' | 'after', ageMinutes: number, alreadyUsed: boolean): ProbeResult {
  if (![5, 30, 31].includes(ageMinutes)) throw new Error('Choose one of the example clock settings.');
  const state = readResetExample(root, project);
  const connection = readConnections(root).find((c) => c.project === project && c.kind === 'example');
  if (!state || !connection) throw new Error('Run this example before trying its recovery link.');
  const expectedRepo = resolve(root, '.buildbrief', 'examples', project);
  if (relative(expectedRepo, resolve(connection.repo)) !== '') throw new Error('The example repository location changed. Run a fresh example.');
  const revision = version === 'before' ? state.beforeRevision : state.afterRevision;
  const source = execFileSync('git', ['show', `${revision}:src/recovery.mjs`], { cwd: expectedRepo, encoding: 'utf8', timeout: 10_000, maxBuffer: 16_384, stdio: ['ignore', 'pipe', 'pipe'] });
  const approvedSource = readFileSync(join(fixtures(), version === 'before' ? 'v2' : 'v3', 'src', 'recovery.mjs'), 'utf8');
  if (source.replaceAll('\r\n', '\n') !== approvedSource.replaceAll('\r\n', '\n')) throw new Error('The example source changed. Run a fresh example before trying it.');
  const moduleUrl = `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;
  const script = `const m=await import(${JSON.stringify(moduleUrl)}); process.stdout.write(JSON.stringify(m.inspectResetLink(${JSON.stringify({ ageMinutes, alreadyUsed })})));`;
  const result = JSON.parse(execFileSync(process.execPath, ['--input-type=module', '-e', script], { encoding: 'utf8', timeout: 5_000, maxBuffer: 4096, stdio: ['ignore', 'pipe', 'pipe'] })) as { allowed: boolean; message: string };
  if (typeof result.allowed !== 'boolean' || typeof result.message !== 'string') throw new Error('The example returned an invalid result.');
  const probe: ProbeResult = { version, ageMinutes, alreadyUsed, ...result, revision, checkedAt: new Date().toISOString() };
  writeFileSync(stateFile(root, project), JSON.stringify({ ...state, latestProbe: probe }, null, 2), 'utf8');
  return probe;
}

export async function createResetExample(root: string): Promise<string> {
  const project = `example-reset-${randomUUID().slice(0, 8)}`;
  const repo = join(root, '.buildbrief', 'examples', project);
  mkdirSync(repo, { recursive: true });
  const git = (args: string[]) => execFileSync('git', args, { cwd: repo, encoding: 'utf8', timeout: 15_000, stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  const commit = (message: string) => {
    git(['add', '-A']);
    git(['-c', 'user.name=BuildBrief seeded example', '-c', 'user.email=example@buildbrief.local', '-c', 'commit.gpgsign=false', 'commit', '-qm', message]);
    return git(['rev-parse', 'HEAD']);
  };
  cpSync(join(fixtures(), 'v1'), repo, { recursive: true });
  git(['init', '-q']);
  const base = commit('seeded recovery screen base');
  cpSync(join(fixtures(), 'v2'), repo, { recursive: true });
  cpSync(join(fixtures(), 'acceptance.mjs'), join(repo, 'acceptance.mjs'));
  const beforeRevision = commit('seeded incomplete password recovery');
  const draft = extractDraft({ projectId: project, featureId: 'Password recovery', completeness: 'manual', prompt: 'Allow a fresh password reset link. Password reset links expire after 30 minutes. Reject an already-used password reset link.' });
  const approval = approveIntent({ intent: draft, actor: 'Seeded example persona (not owner approval)' });
  if (!approval.ok) throw new Error('The example contract is invalid.');
  const store = openProjectStore(root, project);
  appendEvent(store, 'prompt.captured', project, { prompt: draft.exact_source_text, source_hash: draft.source_hash, source: 'seeded_example' });
  appendEvent(store, 'intent.extracted', project, { intent: draft });
  appendEvent(store, 'intent.approved', project, { intent: approval.intent, actor: approval.intent.approved_by, provenance: 'seeded fixture, not owner approval' });
  saveConnection(root, { project, repo, kind: 'example' });
  const before = await doVerify(root, { project, repo, intent: approval.intent, base, provider: 'rules', acceptCommand: 'node acceptance.mjs', acceptCovers: ['src/recovery.mjs'] });
  const oldIds = Object.values(rebuildViews(store, project).findings).map((f) => f.id);
  cpSync(join(fixtures(), 'v3', 'src', 'recovery.mjs'), join(repo, 'src', 'recovery.mjs'));
  const afterRevision = commit('seeded recovery expiry correction');
  const after = await doVerify(root, { project, repo, intent: approval.intent, base, provider: 'rules', acceptCommand: 'node acceptance.mjs', acceptCovers: ['src/recovery.mjs'] });
  appendEvent(store, 'evidence.invalidated', project, { finding_ids: oldIds, reason: 'Seeded reset-policy recheck at corrected revision' });
  appendEvent(store, 'recheck.completed', project, { intent_id: approval.intent.id, provenance: 'seeded example' });
  rebuildViews(store, project);
  mkdirSync(join(root, '.buildbrief', 'example-state'), { recursive: true });
  const state: ResetExample = { project, scenario: 'reset', before: before.run_id, after: after.run_id, beforeRevision, afterRevision };
  writeFileSync(stateFile(root, project), JSON.stringify(state, null, 2), 'utf8');
  probeResetExample(root, project, 'before', 31, false);
  return project;
}
