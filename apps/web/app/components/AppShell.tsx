import type { ReactNode } from 'react';
import { projectHref, projectParams } from '../../lib/context';
import { listProjects, workspaceRoot } from '../../lib/ledger';
import { readConnections } from '../../lib/connections';
import Brand from './Brand';
import { projectName } from '../../lib/presentation';

const navigation = [['/workspace', 'Overview', 'workspace'], ['/new', 'Describe a feature', 'new'], ['/runs', 'Checks & evidence', 'runs'], ['/changes', 'Changes to review', 'changes'], ['/map', 'Understand your product', 'map'], ['/quiz', 'Test yourself', 'quiz']] as const;

export default async function AppShell({ active, children, context = {} }: { active: string; children: ReactNode; context?: Record<string, string | undefined> }) {
  const params = await projectParams(context);
  const project = params['project'] ?? '';
  const root = workspaceRoot();
  const connections = readConnections(root);
  const connection = connections.find((c) => c.project === project);
  const projects = listProjects(root);
  const exampleProjects = projects.filter((p) => connections.some((c) => c.project === p && c.kind === 'example'));
  const regularProjects = projects.filter((p) => !exampleProjects.includes(p));
  return <div className="shell"><aside className="side"><Brand /><p className="tagline">Know what your AI built.</p>
    <div className="project-switcher"><p className="stat-label">Current project</p>
      {project ? <strong>{projectName(project)}</strong> : <span className="muted">No project connected</span>}
      <span className="evidence">{connection?.kind === 'example' ? 'Prepared example · rules-based' : connection?.origin ? 'Local copy from GitHub' : connection ? 'Local repository' : project ? 'Idea stage · no repository yet' : 'Start with an idea or connect code'}</span>
      <a href="/connect">{connection ? 'Manage connection' : 'Connect a project'}</a>
      {projects.length > 1 && <details><summary>Switch project</summary><form method="POST" action="/api/select-project">
        <label>Choose a project<select name="project" defaultValue={project}>
          {regularProjects.length > 0 && <optgroup label="Saved projects">{regularProjects.map((p) => <option key={p} value={p}>{projectName(p)}</option>)}</optgroup>}
          {exampleProjects.length > 0 && <optgroup label="Examples">{exampleProjects.map((p) => <option key={p} value={p}>{projectName(p)}</option>)}</optgroup>}
        </select></label>
        <button className="secondary" type="submit">Open project</button>
      </form></details>}
    </div>
    <p className="navgroup">Your workspace</p><nav className="side-nav" aria-label="Workspace">
      {navigation.map(([href, label, id]) => <a key={id} href={projectHref(href, params)} aria-current={active === id ? 'page' : undefined}><span className="nav-node" aria-hidden="true" />{label}</a>)}
    </nav>
    <p className="navgroup">Resources</p><nav className="side-nav" aria-label="Resources">
      <a href="/start">Start a new idea</a>
      <a href="/connect" aria-current={active === 'connect' ? 'page' : undefined}>Connect a project</a><a href="/how-it-works">How to use BuildBrief</a><a href="/demo">Explore the example</a>
      <a href={projectHref('/settings', params)} aria-current={active === 'settings' ? 'page' : undefined}>Settings & privacy</a>
    </nav>
    <p className="side-foot">Your acceptance workspace.<br />Runs locally. No account required.<br /><a href="/how-it-works#privacy">How your data is handled</a></p>
  </aside><div className="app-body">
    <header className="workspace-topbar"><a href="/">BuildBrief home</a><span>{connection?.kind === 'example' ? 'Seeded example' : 'Local workspace'}</span><a href="/connect">Connect repository</a></header>
    <main id="main" className="content">{children}</main>
  </div></div>;
}
