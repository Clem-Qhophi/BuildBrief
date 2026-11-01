import AppShell from '../components/AppShell';
import { projectParams } from '../../lib/context';
import { comprehensionMap } from '@buildbrief/learning';
import { latestRevision } from '@buildbrief/store';
import { getViews, listQuizzes, listResponses, listRuns, workspaceRoot } from '../../lib/ledger';

export const dynamic = 'force-dynamic';

export default function MapPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  return MapAsync({ searchParams });
}

async function MapAsync({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await projectParams(await searchParams);
  const root = workspaceRoot();
  const project = params['project'] ?? '';
  const intentId = params['intent'] ?? '';
  if (project === '' || intentId === '') {
    const intents = project ? Object.values(getViews(root, project).intents) : [];
    const runs = listRuns(root).filter((r) => r.project === project);
    return (
      <AppShell active="map" context={params}>
        <h1>Understanding Studio</h1>
        <p className="lede">Understand what the implementation establishes, explore it through your role, and answer questions grounded in source evidence.</p>
        {intents.length === 0 ? <div className="empty">No features to explore yet. <a href="/connect">Connect your project</a> and capture a brief, or <a href="/demo">run the working example</a>.</div> :
          <div className="grid cols-2">{intents.map((i) => {
            const run = runs.find((r) => r.intent === i.id);
            const query = new URLSearchParams({ project, intent: i.id, repo: params['repo'] ?? '' });
            return <section key={i.id} className="card"><h2>{i.feature_id}</h2><p className="muted">{run ? 'Explore the latest recorded check. Learning progress comes from your answers.' : 'Verify this brief first to generate explanations and questions grounded in evidence.'}</p>
              {run ? <p><a href={`/run/${encodeURIComponent(run.id)}?${query}#understand`}>Open explanation & questions</a></p> : <p><a href={`/intent/${encodeURIComponent(i.id)}?${query}`}>Review & verify brief</a></p>}
              <p><a href={`/map?${query}`}>Open comprehension map</a></p>
            </section>;
          })}</div>}
      </AppShell>
    );
  }
  const views = getViews(root, project);
  const intent = views.intents[intentId];
  if (intent === undefined) {
    return (
      <AppShell active="map" context={params}>
        <h1>Intent not found</h1>
        <p className="muted"><code>{intentId}</code> is not in project <code>{project}</code>.</p>
        <p><a href={`/workspace?project=${encodeURIComponent(project)}`}>Open the project overview</a> to pick an existing intent.</p>
      </AppShell>
    );
  }
  const findings = new Map<string, string>();
  const intentFindings = Object.values(views.findings).filter((f) => f.requirement_version_id === intentId);
  for (const f of intentFindings) {
    findings.set(f.criterion_id, `${f.finding}${f.stale ? ' (stale)' : ''}`);
  }
  const currentRevision = latestRevision(intentFindings);
  const quizzes = listQuizzes(root);
  const responses = listResponses(root);
  const cells = comprehensionMap({
    criteria: intent.criteria.map((c) => ({ id: c.id, text: c.text })),
    findings,
    quizzes: quizzes as never,
    responses: responses as never,
    currentRevision,
  });
  return (
    <AppShell active="map" context={params}>
      <h1>Comprehension map: {intent.feature_id}</h1>
      <p className="lede">
        What is genuinely understood about this feature — and what is not.
        Only answers against live questions at the current revision (
        <code>{currentRevision === '' ? 'never verified' : currentRevision.slice(0, 7)}</code>) count.
        Everything else degrades to stale, untested, or unmeasured — never a guessed score.
      </p>
      <table>
        <thead>
          <tr>
            <th>Criterion</th>
            <th>Finding</th>
            <th>Status</th>
            <th>Answers</th>
            <th>Note</th>
          </tr>
        </thead>
        <tbody>
          {cells.map((c) => (
            <tr key={c.criterion_id}>
              <td>{c.criterion_text} <div className="evidence">{c.criterion_id}</div></td>
              <td>{c.finding}</td>
              <td><span className={`badge ${c.status === 'demonstrated' ? 'supported' : c.status === 'struggling' ? 'contradicted' : ''}`}>{c.status}</span></td>
              <td className="evidence">
                <span className="segbar" role="img" aria-label={`pass ${c.pass}, fail ${c.fail}, pending ${c.pending}`}>
                  <span className="seg-pass" style={{ flexGrow: c.pass }} />
                  <span className="seg-fail" style={{ flexGrow: c.fail }} />
                  <span className="seg-pending" style={{ flexGrow: c.pending }} />
                </span>
                pass {c.pass} / fail {c.fail} / pending {c.pending}
              </td>
              <td className="evidence">{c.note}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </AppShell>
  );
}
