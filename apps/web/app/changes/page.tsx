import { getViews, listProjects, workspaceRoot } from '../../lib/ledger';

export const dynamic = 'force-dynamic';

export default function ChangesPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  return ChangesAsync({ searchParams });
}

async function ChangesAsync({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  const root = workspaceRoot();
  const projects = listProjects(root);
  const project = params['project'] ?? projects[0] ?? '';
  const views = project === '' ? { orphans: {} } : getViews(root, project);
  const orphans = Object.values(views.orphans);
  return (
    <main>
      <h1>Possibly unrequested changes</h1>
      <p className="muted">
        Informative review items — never accusations. Each needs a human disposition.
      </p>
      {orphans.length === 0 ? (
        <p className="muted">None flagged for this project.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Path</th>
              <th>Risk</th>
              <th>Why flagged</th>
              <th>Disposition</th>
            </tr>
          </thead>
          <tbody>
            {orphans.map((o) => (
              <tr key={o.id}>
                <td><code>{o.path}</code></td>
                <td><span className={`badge ${o.risk}`}>{o.risk}</span></td>
                <td>{o.why_flagged} <span className="evidence">({o.flags.join(', ')})</span></td>
                <td>
                  {o.disposition !== undefined && o.disposition !== 'pending' ? (
                    o.disposition
                  ) : (
                    <form method="POST" action="/api/dispose" className="inline">
                      <input type="hidden" name="project" value={project} />
                      <input type="hidden" name="orphan" value={o.id} />
                      <input type="text" name="by" placeholder="Your name" required size={10} />{' '}
                      <button type="submit" name="disposition" value="explained" className="secondary">Explained</button>{' '}
                      <button type="submit" name="disposition" value="linked" className="secondary">Linked</button>{' '}
                      <button type="submit" name="disposition" value="approved" className="secondary">Approved</button>{' '}
                      <button type="submit" name="disposition" value="rejected" className="secondary">Rejected</button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
