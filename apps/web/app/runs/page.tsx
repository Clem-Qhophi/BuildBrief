import AppShell from '../components/AppShell';
import { projectHref, projectParams } from '../../lib/context';
import { listRuns, workspaceRoot } from '../../lib/ledger';

export const dynamic = 'force-dynamic';

export default async function RunsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await projectParams(await searchParams);
  const root = workspaceRoot();
  const runs = listRuns(root).filter((r) => !params['project'] || r.project === params['project']);
  return (
    <AppShell active="runs" context={params}>
      <h1>Verification runs</h1>
      <p className="lede">Checks for {params['project'] || 'this workspace'}, newest first. Open a run to follow its evidence strand from request to verdict.</p>
      {runs.length === 0 ? (
        <div className="empty">No verification runs for this project yet. <a href={projectHref('/workspace', params)}>Review an intent</a>, approve its criteria, then verify the repository.</div>
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
                  <a href={projectHref(`/run/${encodeURIComponent(r.id)}`, { ...params, project: r.project })}>Open report <code>{r.revision.slice(0, 7)}</code></a>
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
    </AppShell>
  );
}
