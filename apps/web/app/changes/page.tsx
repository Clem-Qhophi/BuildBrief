import AppShell from '../components/AppShell';
import { projectParams } from '../../lib/context';
import { getViews, listProjects, workspaceRoot } from '../../lib/ledger';

export const dynamic = 'force-dynamic';

export default function ChangesPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  return ChangesAsync({ searchParams });
}

async function ChangesAsync({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await projectParams(await searchParams);
  const root = workspaceRoot();
  const projects = listProjects(root);
  const project = params['project'] ?? projects[0] ?? '';
  const views = project === '' ? { orphans: {} } : getViews(root, project);
  const orphans = Object.values(views.orphans);
  return (
    <AppShell active="changes" context={params}>
      <h1>Possibly unrequested changes</h1>
      <p className="lede">
        A flagged change is a request for human investigation — never an
        accusation. Each needs a recorded human decision.
      </p>
      {orphans.length === 0 ? (
        <div className="empty">No possibly unrequested changes are recorded for this project. To inspect scope drift, <a href={`/workspace?project=${encodeURIComponent(project)}`}>open a brief</a> and verify it with a base revision.</div>
      ) : (
        orphans.map((o) => (
          <details
            key={o.id}
            className="finding"
            open={o.disposition === undefined || o.disposition === 'pending'}
          >
            <summary>
              <h2>
                <span className={`badge ${o.risk}`}>{o.risk}</span> <code>{o.path}</code>
              </h2>
            </summary>
            <div className="finding-body">
              <p>{o.why_flagged}</p>
              <p className="evidence">Signals: {o.flags.join(', ')}</p>
              {o.disposition !== undefined && o.disposition !== 'pending' ? (
                <p>Recorded decision: <strong>{o.disposition}</strong></p>
              ) : (
                <form method="POST" action="/api/dispose">
                  <input type="hidden" name="project" value={project} />
                  <input type="hidden" name="orphan" value={o.id} />
                  <label>
                    Decided by{' '}
                    <input type="text" name="by" placeholder="Your name" required size={14} />
                  </label>
                  <p>
                    <button type="submit" name="disposition" value="explained" className="secondary">Explained</button>{' '}
                    <button type="submit" name="disposition" value="linked" className="secondary">Linked</button>{' '}
                    <button type="submit" name="disposition" value="approved" className="secondary">Approved</button>{' '}
                    <button type="submit" name="disposition" value="rejected" className="secondary">Rejected</button>
                  </p>
                </form>
              )}
            </div>
          </details>
        ))
      )}
    </AppShell>
  );
}
