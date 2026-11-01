import { execFileSync } from 'node:child_process';
import { isAbsolute } from 'node:path';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { headSha, isGitRepo } from '@buildbrief/repo';
import { saveConnection } from '../../../lib/connections';
import { getViews, workspaceRoot } from '../../../lib/ledger';
import { importPublicGitHubRepository, publicGitHubRepository } from '../../../lib/github';

export async function POST(request: Request) {
  const form = await request.formData();
  let project = String(form.get('project') ?? '').trim();
  let repo = String(form.get('repo') ?? '').trim();
  const method = form.get('method') === 'github' ? 'github' : 'local';
  const remote = String(form.get('remote') ?? '').trim();
  const intent = String(form.get('intent') ?? '');
  let safeRemote = '';
  let error = '';
  try {
    let origin: string | undefined;
    if (method === 'github') {
      const source = publicGitHubRepository(remote);
      safeRemote = source.url.replace(/\.git$/, '');
      if (!project) project = source.name;
      if (project.length > 120) throw new Error('Project name must be up to 120 characters.');
      const imported = importPublicGitHubRepository(workspaceRoot(), source.url);
      repo = imported.repo;
      origin = imported.origin;
    }
    if (!project || project.length > 120) throw new Error('Project name is required (up to 120 characters).');
    if (!isAbsolute(repo)) throw new Error('Repository directory must be an absolute local path. Clone a remote repository first.');
    if (!isGitRepo(repo) || !headSha(repo)) throw new Error('Repository directory must contain a readable Git checkout with at least one commit.');
    const top = execFileSync('git', ['-C', repo, 'rev-parse', '--show-toplevel'], { encoding: 'utf8', timeout: 10_000, stdio: ['ignore', 'pipe', 'pipe'] }).trim();
    saveConnection(workspaceRoot(), { project, repo: top, kind: 'local', ...(origin ? { origin } : {}) });
    (await cookies()).set('bb-project', project, { httpOnly: true, sameSite: 'strict', path: '/', maxAge: 60 * 60 * 24 * 30 });
  } catch (e) { error = (e as Error).message; }
  if (error) redirect(`/connect?${new URLSearchParams({ project, repo: method === 'github' ? '' : repo, remote: safeRemote, method, intent, error })}`);
  if (intent && getViews(workspaceRoot(), project).intents[intent]) redirect(`/intent/${encodeURIComponent(intent)}?${new URLSearchParams({ project, connected: '1' })}`);
  redirect(`/new?${new URLSearchParams({ project, connected: '1' })}`);
}
