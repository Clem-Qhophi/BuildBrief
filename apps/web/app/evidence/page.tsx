import AppShell from '../components/AppShell';
import { projectHref, projectParams } from '../../lib/context';
import { readReportFile, workspaceRoot } from '../../lib/ledger';
import { viewEvidence } from '@buildbrief/repo';

export const dynamic = 'force-dynamic';

export default function EvidencePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  return EvidenceAsync({ searchParams });
}

async function EvidenceAsync({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  let params = await projectParams(await searchParams);
  const runId = params['run'] ?? '';
  const evidenceId = params['evidence'] ?? '';
  const root = workspaceRoot();
  if (runId === '' || evidenceId === '') {
    return (
      <AppShell active="runs" context={params}>
        <h1>Evidence viewer</h1>
        <p className="muted">Needs <code>run</code>, <code>evidence</code>, and a local <code>repo</code> path. Open it from a run report.</p>
      </AppShell>
    );
  }
  const report = readReportFile(root, runId) as {
    project_id: string;
    checked_revision: string;
    results: {
      criterion: { id: string };
      evidence: {
        id: string;
        path?: string;
        line_start?: number;
        line_end?: number;
        tier: string;
        description: string;
        snippet_hash?: string;
        test_run_id?: string;
      }[];
    }[];
    test_runs?: {
      run: { id: string; command: string[]; exit_code: number; passed: number; failed: number };
      covers: string[];
    }[];
  } | null;
  if (report === null) {
    return (
      <AppShell active="runs" context={params}>
        <h1>Run not found</h1>
        <p className="muted">No stored report <code>{runId}</code>.</p>
        <p><a href="/runs">Open Checks &amp; evidence</a> to choose a stored run.</p>
      </AppShell>
    );
  }
  params = await projectParams({ ...await searchParams, project: report.project_id });
  const repo = params['repo'] ?? '';
  let pointer: {
    id: string;
    path?: string;
    line_start?: number;
    line_end?: number;
    tier: string;
    description: string;
    snippet_hash?: string;
    test_run_id?: string;
  } | undefined;
  for (const r of report.results) {
    const hit = r.evidence.find((e) => e.id === evidenceId);
    if (hit !== undefined) {
      pointer = hit;
      break;
    }
  }
  if (pointer === undefined) {
    return (
      <AppShell active="runs" context={params}>
        <h1>Evidence not found</h1>
        <p className="muted"><code>{evidenceId}</code> is not cited by run <code>{runId}</code>.</p>
        <p><a href={`/run/${encodeURIComponent(runId)}`}>Back to the run report</a> to choose cited evidence.</p>
      </AppShell>
    );
  }
  if (!repo) return <AppShell active="runs" context={params}><h1>Evidence viewer</h1><p className="notice">This report has no saved repository connection. <a href="/connect">Connect the repository</a>, then reopen this evidence from the report.</p></AppShell>;
  const view = viewEvidence({ repo, revision: report.checked_revision, pointer });
  const covering = pointer.test_run_id !== undefined
    ? (report.test_runs ?? []).find((t) => t.run.id === pointer.test_run_id)
    : undefined;
  return (
    <AppShell active="runs" context={params}>
      <h1>Evidence: {view.path}</h1>
      <p className="lede">
        {view.path}
        {view.line_start !== undefined ? `#L${view.line_start}-${view.line_end ?? view.line_start}` : ''} [{view.tier}] — {view.description}
      </p>
      <p><a href={projectHref(`/run/${encodeURIComponent(runId)}`, params)}>Back to the run report</a></p>
      {pointer.test_run_id !== undefined ? (
        <p className="muted">
          {covering === undefined
            ? 'Cites a test run not stored in this report.'
            : `Test-backed by ${covering.run.command.join(' ')} — exit ${covering.run.exit_code}, passed ${covering.run.passed}, failed ${covering.run.failed}.`}
        </p>
      ) : (
        <p className="muted">Source evidence only — no test run backs this span.</p>
      )}
      {view.withheld !== undefined ? (
        <div className="notice">{view.withheld}</div>
      ) : (
        <>
          <p className="muted">{view.provenance}</p>
          <p className="muted">{view.hashCheck}</p>
          <pre>
            {(view.lines ?? []).map((l) => (
              <div key={l.n} style={l.cited ? { background: '#edf4f0', borderLeft: '3px solid var(--accent)' } : undefined}>
                {String(l.n).padStart(4, ' ')}  {l.text}
              </div>
            ))}
          </pre>
        </>
      )}
    </AppShell>
  );
}
