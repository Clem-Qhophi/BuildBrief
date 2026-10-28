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
  const params = await searchParams;
  const runId = params['run'] ?? '';
  const evidenceId = params['evidence'] ?? '';
  const repo = params['repo'] ?? '';
  const root = workspaceRoot();
  if (runId === '' || evidenceId === '' || repo === '') {
    return (
      <main>
        <h1>Evidence viewer</h1>
        <p className="muted">Needs <code>run</code>, <code>evidence</code>, and a local <code>repo</code> path. Open it from a run report.</p>
      </main>
    );
  }
  const report = readReportFile(root, runId) as {
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
      <main>
        <h1>Run not found</h1>
        <p className="muted">No stored report <code>{runId}</code>.</p>
      </main>
    );
  }
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
      <main>
        <h1>Evidence not found</h1>
        <p className="muted"><code>{evidenceId}</code> is not cited by run <code>{runId}</code>.</p>
      </main>
    );
  }
  const view = viewEvidence({ repo, revision: report.checked_revision, pointer });
  const covering = pointer.test_run_id !== undefined
    ? (report.test_runs ?? []).find((t) => t.run.id === pointer.test_run_id)
    : undefined;
  return (
    <main>
      <h1>Evidence <code>{view.pointerId}</code></h1>
      <p className="muted">
        {view.path}
        {view.line_start !== undefined ? `#L${view.line_start}-${view.line_end ?? view.line_start}` : ''} [{view.tier}] — {view.description}
      </p>
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
              <div key={l.n} style={l.cited ? { background: '#eef6ee' } : undefined}>
                {String(l.n).padStart(4, ' ')}  {l.text}
              </div>
            ))}
          </pre>
        </>
      )}
    </main>
  );
}
