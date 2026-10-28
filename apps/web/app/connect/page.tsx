import { headSha, isGitRepo } from '@buildbrief/repo';
import { ledgerExists, listProjects, workspaceRoot } from '../../lib/ledger';
import { openProjectStore, readEvents } from '@buildbrief/store';

export const dynamic = 'force-dynamic';

function repoStatus(repo: string): { label: string; detail: string } {
  if (repo === '') {
    return { label: 'No repository selected', detail: 'Pass ?repo=… or enter one below. The repo stays on this machine.' };
  }
  if (!isGitRepo(repo)) {
    return { label: 'Not a git repository', detail: `${repo} is not readable as a git checkout. Verification needs commits to pin revisions.` };
  }
  const head = headSha(repo);
  return {
    label: 'Connected',
    detail: `HEAD ${head === null ? 'unknown' : head.slice(0, 7)} at ${repo}`,
  };
}

function providerStatus(): { label: string; detail: string } {
  const keySet = process.env['BB_META_API_KEY'] !== undefined && process.env['BB_META_API_KEY'] !== '';
  return {
    label: 'rules (deterministic, offline)',
    detail: keySet
      ? 'Meta key is set in the server environment — the meta provider is available in verify forms. Key value never displayed.'
      : 'No Meta key in the server environment — meta provider calls fail loudly until one is set. See docs/META_SETUP.md.',
  };
}

export default function ConnectPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  return ConnectAsync({ searchParams });
}

async function ConnectAsync({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const root = workspaceRoot();
  const repo = params['repo'] ?? '';
  const hasLedger = ledgerExists(root);
  let events = 0;
  let projects: string[] = [];
  if (hasLedger) {
    const store = openProjectStore(root, '_web');
    events = readEvents(store).length;
    projects = listProjects(root);
  }
  const repoSt = repoStatus(repo);
  const provider = providerStatus();
  return (
    <main>
      <h1>Connect a project</h1>
      <p className="muted">
        A project is a name in a ledger plus a local repository to verify.
        Nothing leaves this machine; source is read locally, verdicts are
        computed locally unless you pick the Meta provider.
      </p>
      <h2>Workspace</h2>
      <table>
        <tbody>
          <tr>
            <td>Directory</td>
            <td><code>{root}</code></td>
          </tr>
          <tr>
            <td>Ledger</td>
            <td>{hasLedger ? `${events} events — projects: ${projects.join(', ') || 'none yet'}` : 'no ledger here yet — capture your first intent below'}</td>
          </tr>
        </tbody>
      </table>
      <h2>Repository</h2>
      <table>
        <tbody>
          <tr>
            <td>Status</td>
            <td>{repoSt.label} — <span className="muted">{repoSt.detail}</span></td>
          </tr>
        </tbody>
      </table>
      <form method="GET" action="/connect">
        <input type="text" name="repo" defaultValue={repo} placeholder="C:\path\to\repo" size={48} />{' '}
        <button type="submit">Inspect repository</button>
      </form>
      <h2>AI provider</h2>
      <table>
        <tbody>
          <tr>
            <td>Active default</td>
            <td>{provider.label} — <span className="muted">{provider.detail}</span></td>
          </tr>
        </tbody>
      </table>
      <h2>Start verifying</h2>
      <p>
        <a href={`/new${repo !== '' ? `?repo=${encodeURIComponent(repo)}` : ''}`}>Capture a new intent</a>
        {' '}for this workspace{repo !== '' ? ' and repository' : ''}, or open the{' '}
        <a href="/">intent ledger</a>.
      </p>
      <h2>Labeled demo project</h2>
      <p className="muted">
        No repository handy? Build the seeded referral demo (v1 base, v2 faulty
        feature) with provenance labels — v1/v2/v3 are test conditions, not
        organic agent output:
      </p>
      <pre>{`node samples/demo-seed.mjs <ledger-dir> <repo-dir> [project]`}</pre>
      <p className="muted">Then point this page at that ledger with BB_WORKSPACE and inspect it here.</p>
    </main>
  );
}
