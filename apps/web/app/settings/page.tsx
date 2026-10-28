import { execFileSync } from 'node:child_process';
import { headSha } from '@buildbrief/repo';
import { ledgerExists, listProjects, workspaceRoot } from '../../lib/ledger';
import { openProjectStore, readEvents } from '@buildbrief/store';

export const dynamic = 'force-dynamic';

function keyPresence(): string {
  return process.env['BB_META_API_KEY'] !== undefined && process.env['BB_META_API_KEY'] !== ''
    ? 'set (value never displayed)'
    : 'not set — Meta provider calls fail loudly until it is';
}

function repoHead(repo: string): string {
  if (repo === '') return 'no repository given (pass ?repo=… to inspect one)';
  try {
    return headSha(repo) ?? 'not a git repository (or unreadable)';
  } catch {
    return 'not a git repository (or unreadable)';
  }
}

function nodeVersion(): string {
  try {
    return (execFileSync(process.execPath, ['--version'], { encoding: 'utf8' }) as string).trim();
  } catch {
    return 'unknown';
  }
}

export default function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  return SettingsAsync({ searchParams });
}

async function SettingsAsync({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const root = workspaceRoot();
  const repo = params['repo'] ?? '';
  const hasLedger = ledgerExists(root);
  let eventCount = 0;
  let projects: string[] = [];
  if (hasLedger) {
    const store = openProjectStore(root, '_web');
    eventCount = readEvents(store).length;
    projects = listProjects(root);
  }
  return (
    <main>
      <h1>Settings & connection status</h1>
      <p className="muted">Read-only status. Nothing here uploads code or changes providers.</p>
      <table>
        <tbody>
          <tr>
            <td>Workspace</td>
            <td><code>{root}</code></td>
          </tr>
          <tr>
            <td>Ledger</td>
            <td>{hasLedger ? `${eventCount} events, projects: ${projects.join(', ') || 'none'}` : 'no ledger in this workspace'}</td>
          </tr>
          <tr>
            <td>Repository</td>
            <td><code>{repoHead(repo)}</code></td>
          </tr>
          <tr>
            <td>Meta API key</td>
            <td>{keyPresence()}</td>
          </tr>
          <tr>
            <td>Runtime</td>
            <td><code>{nodeVersion()}</code> — Build Brief 0.1.0, deterministic rules engine default</td>
          </tr>
          <tr>
            <td>Network</td>
            <td>Server binds loopback only. Mutation APIs have no auth — never expose this port beyond your machine.</td>
          </tr>
        </tbody>
      </table>
      <h2>Data management</h2>
      <p>
        <a href="/api/export">Download the raw ledger log (JSONL)</a>
      </p>
      <p className="muted">
        History is append-only and immutable: there is no delete or edit —
        corrections are new events, stale findings stay readable. Back up the
        workspace directory to preserve everything, including reports.
      </p>
      <h2>Privacy</h2>
      <p className="muted">
        Repository contents stay on this machine: verification reads local
        files, and only the deterministic engine runs by default. The Meta
        provider sends evidence excerpts to Meta only when you pick it and set
        a key — see <code>docs/PRIVACY.md</code> and <code>docs/MODEL_DISCLOSURE.md</code>.
      </p>
    </main>
  );
}
