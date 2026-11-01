import AppShell from '../components/AppShell';
import { projectParams } from '../../lib/context';
import { getViews, listRuns, workspaceRoot } from '../../lib/ledger';
import { readinessSummary } from '../../lib/assurance';

export const dynamic = 'force-dynamic';

const STATUS_WORDS: Record<string, string> = {
  established: 'Established — the latest check supports it.',
  attention: 'Needs attention — the latest check left findings open.',
  stale: 'Stale — re-verify to refresh the evidence.',
  'never-run': 'Never checked — approve the brief, then verify it.',
  draft: 'Draft — review and approve the brief first.',
};

export default function ReadinessPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  return ReadinessAsync({ searchParams });
}

async function ReadinessAsync({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await projectParams(await searchParams);
  const root = workspaceRoot();
  const project = params['project'] ?? '';
  if (project === '') {
    return (
      <AppShell active="readiness" context={params}>
        <h1>Release readiness</h1>
        <p className="lede">What is proven, what is stale, and what was never checked — per feature.</p>
        <div className="empty">No project selected. <a href="/connect">Connect your project</a> to assess readiness.</div>
      </AppShell>
    );
  }
  const views = getViews(root, project);
  const runs = listRuns(root).filter((r) => r.project === project);
  const { rows, openGates } = readinessSummary({
    intents: Object.values(views.intents),
    findings: Object.values(views.findings).map((f) => ({ id: f.id, requirement_version_id: f.requirement_version_id, run_id: f.run_id, finding: f.finding, stale: f.stale })),
    runs: runs.map((r) => ({ id: r.id, intent: r.intent })),
    latestRunIds: [...new Set(Object.values(views.intents).map((i) => runs.find((r) => r.intent === i.id)?.id).filter((id) => typeof id === 'string'))],
    gates: Object.values(views.gates ?? {}),
  });
  const established = rows.filter((r) => r.status === 'established').length;
  return (
    <AppShell active="readiness" context={params}>
      <h1>Release readiness</h1>
      <p className="lede">{established} of {rows.length} feature{rows.length === 1 ? '' : 's'} established{openGates > 0 ? ` · ${openGates} open repair gate${openGates === 1 ? '' : 's'}` : ''}. Read from stored runs only — nothing here is a live check.</p>
      {rows.length === 0 ? (
        <div className="empty">No features yet. <a href="/connect">Connect your project</a> and capture a brief, or <a href="/demo">run the working example</a>.</div>
      ) : (
        <ol className="flow">
          {rows.map((row) => (
            <li key={row.intent_id} className="flow-item">
              <span className={`badge ${row.status === 'established' ? 'supported' : row.status === 'attention' ? 'contradicted' : ''}`}>{row.status}</span>{' '}
              <strong>{row.feature}</strong>{' '}
              <span className="muted">{STATUS_WORDS[row.status]}</span>{' '}
              {row.run_id !== null
                ? <a href={`/run/${encodeURIComponent(row.run_id)}?project=${encodeURIComponent(project)}`}>Open the report</a>
                : <a href={`/intent/${encodeURIComponent(row.intent_id)}?project=${encodeURIComponent(project)}`}>Open the brief</a>}
            </li>
          ))}
        </ol>
      )}
      <h2>Known limitations</h2>
      <ul>
        <li>No browser, staging, or production checks run in this release — local evidence only.</li>
        <li>Hook event capture is unverified on this machine; silent sessions are labelled, not assumed quiet.</li>
        <li>A passing report describes its saved revision; later edits need a new check.</li>
      </ul>
      <h2>Take the evidence with you</h2>
      <p><a href="/api/export">Download the raw ledger log (JSONL)</a> · <a href={`/workspace?project=${encodeURIComponent(project)}`}>Back to the project overview</a></p>
    </AppShell>
  );
}
