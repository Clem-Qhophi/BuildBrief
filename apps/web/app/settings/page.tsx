import AppShell from '../components/AppShell';
import { projectParams } from '../../lib/context';
import { execFileSync } from 'node:child_process';
import { headSha } from '@buildbrief/repo';
import { META_DEFAULT_MODEL } from '@buildbrief/model-meta';
import { ledgerExists, listProjects, workspaceRoot } from '../../lib/ledger';
import { projectName } from '../../lib/presentation';
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
  const params = await projectParams(await searchParams);
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
    <AppShell active="settings" context={params}>
      <h1>Settings & connection status</h1>
      <p className="lede">Read-only status: provider, privacy, workspace, and exports. Nothing here uploads code or changes providers.</p>
      <table>
        <tbody>
          <tr>
            <td>Workspace</td>
            <td><code>{root}</code></td>
          </tr>
          <tr>
            <td>Ledger</td>
            <td>{hasLedger ? `${eventCount} events, projects: ${projects.map(projectName).join(', ') || 'none'}` : 'no ledger in this workspace'}</td>
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
        Rules-based verification runs offline against local files. Explicitly
        selecting the Meta provider sends filtered request and evidence context
        to Meta. Provider and model are recorded with each run.
        <a href="/how-it-works#privacy"> Read the data boundaries.</a>{' '}
        <a href={`/connections${repo !== '' ? `?repo=${encodeURIComponent(repo)}` : ''}`}>Set up agent connections</a>.
      </p>
      <h2>Model provider (bring your own)</h2>
      <p className="muted">
        Default: the deterministic rules engine, fully offline. Nothing leaves
        this machine unless you choose otherwise. Meta is used only when you
        select the meta provider in a verify form and a key is configured;
        provider and model are recorded on every run.
      </p>
      <table>
        <tbody>
          <tr>
            <td>Meta API key</td>
            <td>{keyPresence()}</td>
          </tr>
          <tr>
            <td>Effective model</td>
            <td><code>{process.env['BB_META_MODEL'] ?? META_DEFAULT_MODEL}</code> (override with BB_META_MODEL)</td>
          </tr>
        </tbody>
      </table>
      <p className="muted">To configure the key for this server session:</p>
      <pre>{'$env:BB_META_API_KEY = "<your key>"\n# then restart the server so the new session picks it up'}</pre>
      <p className="muted">
        Never share or commit the key. Meta calls may incur charges and send
        only filtered requirement and evidence context. Without a key, Meta
        verification fails loudly instead of pretending to check.
      </p>
    </AppShell>
  );
}
