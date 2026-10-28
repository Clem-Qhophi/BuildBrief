import { ledgerExists, listIntents, listProjects, workspaceRoot } from '../lib/ledger';

export const dynamic = 'force-dynamic';

export default function Home({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  return HomeAsync({ searchParams });
}

async function HomeAsync({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const root = workspaceRoot();
  if (!ledgerExists(root)) {
    return (
      <main>
        <h1>No ledger found</h1>
        <p className="muted">
          This workbench reads <code>.buildbrief/events.jsonl</code> from a workspace. Nothing is
          fabricated when it is missing.
        </p>
        <div className="notice">
          Start it against a real ledger: <code>BB_WORKSPACE=&lt;your-project&gt; npm run web</code>,
          or run <code>bb capture</code> in a project first.
        </div>
        <p className="muted">Looked in: <code>{root}</code></p>
      </main>
    );
  }
  const params = await searchParams;
  const projects = listProjects(root);
  const project = params['project'] ?? projects[0] ?? '';
  const intents = project === '' ? [] : listIntents(root, project);
  return (
    <main>
      <h1>Intent ledger</h1>
      <p className="muted">
        Workspace <code>{root}</code> — {projects.length} project{projects.length === 1 ? '' : 's'}.{' '}
        <a href="/new">New intent</a>
      </p>
      <p>
        {projects.map((p) => (
          <span key={p} style={{ marginRight: 8 }}>
            {p === project ? <strong>{p}</strong> : <a href={`/?project=${encodeURIComponent(p)}`}>{p}</a>}
          </span>
        ))}
      </p>
      {intents.length === 0 ? (
        <p className="muted">No intents recorded for this project yet.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Feature</th>
              <th>Version</th>
              <th>State</th>
              <th>Criteria</th>
              <th>Approved by</th>
            </tr>
          </thead>
          <tbody>
            {intents.map((i) => (
              <tr key={i.id}>
                <td>
                  <a href={`/intent/${encodeURIComponent(i.id)}?project=${encodeURIComponent(project)}`}>{i.feature}</a>
                  <div className="evidence">{i.id}</div>
                </td>
                <td>v{i.version}</td>
                <td>
                  <span className={`badge ${i.state === 'approved' ? 'supported' : ''}`}>{i.state}</span>
                </td>
                <td>{i.criteria}</td>
                <td>{i.approvedBy ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
