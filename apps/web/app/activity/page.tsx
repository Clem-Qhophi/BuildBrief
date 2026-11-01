import AppShell from '../components/AppShell';
import { projectParams } from '../../lib/context';
import { getViews, workspaceRoot } from '../../lib/ledger';
import { buildTimeline } from '../../lib/activity';

export const dynamic = 'force-dynamic';

export default function ActivityPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  return ActivityAsync({ searchParams });
}

async function ActivityAsync({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await projectParams(await searchParams);
  const root = workspaceRoot();
  const project = params['project'] ?? '';
  if (project === '') {
    return (
      <AppShell active="activity" context={params}>
        <h1>Agent activity</h1>
        <p className="lede">Every supported agent event, in order, with the gaps labelled.</p>
        <div className="empty">No project selected. <a href="/connect">Connect your project</a>, then run <code>bb init</code> in the repository to check agent wiring.</div>
      </AppShell>
    );
  }
  const views = getViews(root, project);
  const sessions = Object.values(views.sessions ?? {}).sort((a, b) => (a.started_at < b.started_at ? -1 : 1));
  const rows = buildTimeline({ sessions, sessionEvents: views.sessionEvents ?? {}, gates: views.gates ?? {} });
  return (
    <AppShell active="activity" context={params}>
      <h1>Agent activity</h1>
      <p className="lede">Supported session, tool, file and test events for {project}. Missing ends and silent sessions are labelled — never shown as quiet.</p>
      {sessions.length === 0 ? (
        <div className="empty">No agent sessions recorded for this project yet. Run <code>bb init</code> in the repository to check wiring, then work with a supported agent. Events captured by hooks appear here; anything missed is reconciled against the git diff.</div>
      ) : (
        <ol className="timeline">
          {rows.map((row, i) => (
            <li key={i} className={row.kind === 'gap' ? 'notice' : undefined}>
              <span className="evidence">{row.at}</span>{' '}
              <strong>{row.label}</strong>
              {row.capturedVia !== undefined && <span className="evidence"> · via {row.capturedVia}</span>}
              {row.detail !== undefined && <p className="muted">{row.detail}</p>}
            </li>
          ))}
        </ol>
      )}
    </AppShell>
  );
}
