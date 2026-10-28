import { listRuns, workspaceRoot } from '../../lib/ledger';

export const dynamic = 'force-dynamic';

export default function RunsPage() {
  const root = workspaceRoot();
  const runs = listRuns(root);
  return (
    <main>
      <h1>Verification runs</h1>
      {runs.length === 0 ? (
        <p className="muted">No stored reports in <code>{root}/.buildbrief/reports</code> yet.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Run</th>
              <th>Revision</th>
              <th>Summary</th>
              <th>Provider</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {runs.map((r) => (
              <tr key={r.id}>
                <td>
                  <a href={`/run/${encodeURIComponent(r.id)}${r.project !== '' ? `?project=${encodeURIComponent(r.project)}` : ''}`}><code>{r.id.slice(0, 24)}…</code></a>
                </td>
                <td><code>{r.revision.slice(0, 7)}</code></td>
                <td>{r.summary}</td>
                <td className="evidence">{r.provider}</td>
                <td className="evidence">{r.created}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
