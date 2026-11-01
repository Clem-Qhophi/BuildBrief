import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { cpSync, existsSync, mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { approveIntent, extractDraft } from '@buildbrief/domain';
import { appendEvent, openProjectStore, rebuildViews } from '@buildbrief/store';
import { doVerify } from './actions';
import { saveConnection } from './connections';

/** Seeded scenario only. No owner repository is changed or approved. */
export async function createExample(root: string): Promise<string> {
  const fixtures = resolve(process.cwd(), '..', '..', 'samples', 'referral-demo');
  if (!existsSync(join(fixtures, 'v1'))) throw new Error('Example fixtures are unavailable. Start the app from the BuildBrief checkout.');
  const project = `example-referral-${randomUUID().slice(0, 8)}`;
  const repo = join(root, '.buildbrief', 'examples', project);
  // Unique directory; never reset or delete a caller-supplied path.
  mkdirSync(repo, { recursive: true });
  const git = (args: string[]) => execFileSync('git', args, { cwd: repo, encoding: 'utf8', timeout: 15_000, stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  const commit = (message: string) => {
    git(['add', '-A']);
    git(['-c', 'user.name=BuildBrief seeded example', '-c', 'user.email=example@buildbrief.local', '-c', 'commit.gpgsign=false', 'commit', '-qm', message]);
    return git(['rev-parse', 'HEAD']);
  };
  cpSync(join(fixtures, 'v1'), repo, { recursive: true });
  git(['init', '-q']);
  const base = commit('seeded base fixture');
  cpSync(join(fixtures, 'v2'), repo, { recursive: true });
  commit('seeded incomplete referral feature');
  const draft = extractDraft({ projectId: project, featureId: 'referral', completeness: 'manual', prompt: 'Add referral codes with 20 percent credit on first invoice. Codes expire after 30 days. Do not modify authentication.' });
  const approval = approveIntent({ intent: draft, actor: 'Seeded example persona (not owner approval)' });
  if (!approval.ok) throw new Error('Example fixture approval is invalid.');
  const store = openProjectStore(root, project);
  appendEvent(store, 'prompt.captured', project, { prompt: draft.exact_source_text, source_hash: draft.source_hash, source: 'seeded_example' });
  appendEvent(store, 'intent.extracted', project, { intent: draft });
  appendEvent(store, 'intent.approved', project, { intent: approval.intent, actor: approval.intent.approved_by, provenance: 'seeded fixture, not owner approval' });
  saveConnection(root, { project, repo, kind: 'example' });
  const before = await doVerify(root, { project, repo, intent: approval.intent, base, provider: 'rules' });
  const oldIds = Object.values(rebuildViews(store, project).findings).map((f) => f.id);
  cpSync(join(fixtures, 'v3', 'src', 'referral.js'), join(repo, 'src', 'referral.js'));
  cpSync(join(fixtures, 'expiry.check.mjs'), join(repo, 'expiry.check.mjs'));
  commit('seeded 30-day expiry correction and acceptance check');
  const after = await doVerify(root, { project, repo, intent: approval.intent, base, provider: 'rules', acceptCommand: 'node expiry.check.mjs', acceptCovers: ['src/referral.js'] });
  appendEvent(store, 'evidence.invalidated', project, { finding_ids: oldIds, reason: 'Seeded example recheck at corrected revision' });
  appendEvent(store, 'recheck.completed', project, { intent_id: approval.intent.id, provenance: 'seeded example' });
  rebuildViews(store, project);
  return project;
}
