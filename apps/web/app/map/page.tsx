import { comprehensionMap } from '@buildbrief/learning';
import { latestRevision } from '@buildbrief/store';
import { getViews, listQuizzes, listResponses, workspaceRoot } from '../../lib/ledger';

export const dynamic = 'force-dynamic';

export default function MapPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  return MapAsync({ searchParams });
}

async function MapAsync({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  const root = workspaceRoot();
  const project = params['project'] ?? '';
  const intentId = params['intent'] ?? '';
  if (project === '' || intentId === '') {
    return (
      <main>
        <h1>Comprehension map</h1>
        <p className="muted">Pick an intent first — the map is per approved contract.</p>
        <p><a href="/">Back to intents</a></p>
      </main>
    );
  }
  const views = getViews(root, project);
  const intent = views.intents[intentId];
  if (intent === undefined) {
    return (
      <main>
        <h1>Intent not found</h1>
        <p className="muted"><code>{intentId}</code> is not in project <code>{project}</code>.</p>
      </main>
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
    <main>
      <h1>Comprehension map: {intent.feature_id}</h1>
      <p className="muted">
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
              <td className="evidence">pass {c.pass} / fail {c.fail} / pending {c.pending}</td>
              <td className="evidence">{c.note}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
