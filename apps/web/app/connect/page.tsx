import AppShell from '../components/AppShell';
import { projectParams } from '../../lib/context';
import { headSha, isGitRepo } from '@buildbrief/repo';
import { workspaceRoot } from '../../lib/ledger';
import { readConnections } from '../../lib/connections';

export const dynamic = 'force-dynamic';

export default async function ConnectPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const raw = await searchParams;
  const params = await projectParams(raw);
  const root = workspaceRoot();
  const repo = params['repo'] ?? '';
  const project = params['project'] ?? '';
  const connection = readConnections(root).find((c) => c.project === project);
  const method = raw['method'] === 'github' ? 'github' : raw['method'] === 'local' || raw['repo'] !== undefined || repo ? 'local' : 'github';
  const valid = repo !== '' && isGitRepo(repo) && headSha(repo) !== null;
  const error = params['error'];
  const methodLink = (value: string) => `/connect?${new URLSearchParams({ project, method: value, ...(raw['intent'] ? { intent: raw['intent'] } : {}), ...(value === 'local' && repo ? { repo } : {}) })}`;
  return <AppShell active="connect" context={params}>
    <p className="breadcrumb"><a href="/workspace">Workspace</a> / Connect</p>
    <h1>Connect a project</h1>
    <p className="lede">Bring the product you’re building. Connect its source code, then tell BuildBrief what one feature should do.</p>
    <div className="onboarding-grid">
      <section className="card connection-form"><h2>Where is your project?</h2>
        <nav className="connection-methods" aria-label="Repository connection method"><a href={methodLink('github')} aria-current={method === 'github' ? 'page' : undefined}>Public GitHub link</a><a href={methodLink('local')} aria-current={method === 'local' ? 'page' : undefined}>Folder on this computer</a></nav>
        {connection?.kind === 'example' && <p className="notice">This is an example project. <a href="/connect?project=&method=github">Connect your own project instead</a>.</p>}
        {error && <div className="notice error" role="alert"><strong>Couldn’t connect this project.</strong><p>{error}</p></div>}
        <form method="POST" action="/api/connect">
          <input type="hidden" name="method" value={method} />
          <input type="hidden" name="intent" value={raw['intent'] ?? ''} />
          {method === 'github' ? <>
            <label htmlFor="remote">GitHub repository URL</label><input id="remote" name="remote" type="url" defaultValue={raw['remote'] ?? ''} placeholder="https://github.com/owner/project" required autoComplete="off" spellCheck={false} aria-describedby="remote-help" />
            <p id="remote-help" className="evidence">Public repositories only. We download a local copy; the original repository is not changed. No GitHub sign-in or token is needed.</p>
          </> : <>
            <label htmlFor="repo">Repository directory</label><input id="repo" name="repo" defaultValue={repo} placeholder="C:\path\to\repo" required aria-describedby="repo-help" autoComplete="off" spellCheck={false} />
            <p id="repo-help" className="evidence">The full folder path on this computer. It needs to be a Git repository with at least one saved commit. Private repositories can use this route.</p>
          </>}
          <label htmlFor="project">Project name {method === 'github' ? '(optional)' : ''}</label>
          <input id="project" name="project" defaultValue={connection?.kind === 'example' ? '' : project} maxLength={120} placeholder={method === 'github' ? 'Use the repository name' : 'My product'} required={method === 'local'} autoComplete="off" />
          <button type="submit">Connect repository & continue</button>
          {method === 'github' && <p className="evidence">The browser will wait while the repository downloads. Source code is read as data; this action does not install packages or run its code.</p>}
        </form>
        {method === 'local' && repo && <p className="connection-result">{valid ? <>Repository found{connection ? ' · connection saved' : ' · connect it to continue'}</> : 'This folder is not a readable Git repository with a saved commit.'}</p>}
      </section>
      <aside className="onboarding-help"><h2>Don’t have a repository?</h2><p><a href="/start">Start with your idea</a> and create a build brief before any code exists. Or open the password-recovery example and test what happens when a link expires.</p><a className="button secondary" href="/demo?scenario=reset">Try the example</a>
        <h3>What happens after connecting?</h3><p>Describe a feature in your own words. Review the brief, approve what you mean, and check it against the implementation. Source and test details are there when you need them.</p>
        <h3>What will this cost?</h3><p>Local rules-based checks and the included examples make no paid API calls. Optional model-assisted checks require your own configured provider and may incur its charges.</p>
        <h3>Where does my code go?</h3><p>It is read on this computer. Only explicitly selecting an AI provider sends filtered requirements and evidence context to that provider.</p>
      </aside>
    </div>
    <details className="technical-details"><summary>Workspace & Ledger details</summary><p>Ledger and reports: <code>{root}/.buildbrief</code>. Connecting changes no source files in your original repository and approves no requirement. GitHub imports are local snapshots; reconnect to fetch a new snapshot.</p></details>
  </AppShell>;
}
