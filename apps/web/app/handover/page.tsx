import AppShell from '../components/AppShell';
import { projectParams } from '../../lib/context';
import type { VerificationReport } from '@buildbrief/verifier';
import { roleTour } from '@buildbrief/learning';
import { getViews, readReportFile, workspaceRoot } from '../../lib/ledger';

export const dynamic = 'force-dynamic';

const ROLES = ['engineer', 'founder', 'qa', 'marketing'];

/**
 * Team handover: the same verified run briefed per role. Local mode has one
 * user and no invites — this page shares understanding, not access.
 */
export default function HandoverPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  return HandoverAsync({ searchParams });
}

async function HandoverAsync({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await projectParams(await searchParams);
  const project = params['project'] ?? '';
  const intentId = params['intent'] ?? '';
  const runId = params['run'] ?? '';
  const root = workspaceRoot();
  if (project === '' || intentId === '' || runId === '') {
    return (
      <AppShell active="map" context={params}>
        <h1>Team handover</h1>
        <p className="muted">
          Needs <code>project</code>, <code>intent</code>, and <code>run</code> —
          open it from a run report. Each role gets the same evidence with the
          unknowns relevant to their job.
        </p>
      </AppShell>
    );
  }
  const views = getViews(root, project);
  const intent = views.intents[intentId];
  const report = readReportFile(root, runId) as VerificationReport | null;
  if (intent === undefined || report === null) {
    return (
      <AppShell active="map" context={params}>
        <h1>Team handover</h1>
        <p className="muted">Unknown intent or run in this workspace.</p>
        <p><a href={`/workspace?project=${encodeURIComponent(project)}`}>Open the project overview</a> or <a href={`/runs?project=${encodeURIComponent(project)}`}>choose a checked run</a> first.</p>
      </AppShell>
    );
  }
  const briefs = ROLES.map((role) => {
    try {
      const b = roleTour({ projectId: project, role, intent, report });
      return { role, sections: b.sections, unknowns: b.unknowns, error: undefined as string | undefined };
    } catch (e) {
      return { role, sections: [], unknowns: [], error: (e as Error).message };
    }
  });
  return (
    <AppShell active="map" context={params}>
      <h1>Handover: {intent.feature_id} @ {report.checked_revision.slice(0, 7)}</h1>
      <p className="lede">
        Same verified run, four briefings — one per role. Nothing is invented:
        where the ledger is silent, each brief says unknown.
      </p>
      {briefs.map((b) => (
        <section key={b.role} className="section">
          <h2>{b.role}</h2>
          {b.error !== undefined ? (
            <p className="muted">Unavailable: {b.error}</p>
          ) : (
            <>
              {b.sections.map((s) => (
                <div key={s.heading}>
                  <h3>{s.heading}</h3>
                  <p>{s.body}</p>
                </div>
              ))}
              {b.unknowns.length > 0 && (
                <p className="muted">Unknowns for {b.role}: {b.unknowns.join('; ')}</p>
              )}
            </>
          )}
        </section>
      ))}
    </AppShell>
  );
}
