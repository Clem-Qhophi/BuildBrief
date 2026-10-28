import type { CorrectionPack, IntentVersion } from '@buildbrief/domain';
import type { VerificationReport } from '@buildbrief/verifier';
import { explainFeature, roleTour } from '@buildbrief/learning';
import { getViews, listQuizzes, listResponses, readReportFile, workspaceRoot } from '../../../lib/ledger';

export const dynamic = 'force-dynamic';

interface Evidence {
  id: string;
  tier: string;
  path?: string;
  line_start?: number;
  line_end?: number;
  description: string;
  test_run_id?: string;
}

interface RecordedTestRun {
  run: {
    id: string;
    revision: string;
    command: string[];
    exit_code: number;
    passed: number;
    failed: number;
  };
  covers: string[];
}

interface Result {
  criterion: { id: string; text: string };
  evidence: Evidence[];
  finding: {
    id: string;
    finding: string;
    evidence_grade: string;
    confidence: number;
    rationale: string;
    missing_proof: string[];
  };
  adjudicatorNotes: string[];
}

interface Orphan {
  id: string;
  path: string;
  risk: string;
  flags: string[];
  why_flagged: string;
  disposition?: string;
}

export default function RunPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  return RunAsync({ params, searchParams });
}

function testRunSummary(t: RecordedTestRun | undefined): string {
  if (t === undefined) return 'recorded run not in this report';
  return `${t.run.command.join(' ')} — exit ${t.run.exit_code}, passed ${t.run.passed}, failed ${t.run.failed}`;
}

function tourFor(
  project: string,
  role: string,
  intent: IntentVersion,
  report: VerificationReport,
): { sections: { heading: string; body: string }[]; unknowns: string[]; error?: string } {
  try {
    const brief = roleTour({ projectId: project, role, intent, report });
    return { sections: brief.sections, unknowns: brief.unknowns };
  } catch (e) {
    return { sections: [], unknowns: [], error: (e as Error).message };
  }
}

function UnderstandBlock({
  project,
  intentId,
  runId,
  repo,
  role,
  explanation,
  tour,
  quizzes,
  responses,
}: {
  project: string;
  intentId: string;
  runId: string;
  repo: string;
  role: string;
  explanation: ReturnType<typeof explainFeature>;
  tour: ReturnType<typeof tourFor>;
  quizzes: ReturnType<typeof listQuizzes>;
  responses: ReturnType<typeof listResponses>;
}) {
  const self = `?project=${encodeURIComponent(project)}${repo !== '' ? `&repo=${encodeURIComponent(repo)}` : ''}`;
  return (
    <>
      <h3>What this run establishes</h3>
      <p>{explanation.summary}</p>
      {explanation.unknowns.length > 0 && (
        <p className="muted">Unknowns: {explanation.unknowns.join('; ')}</p>
      )}
      <h3>Role tour ({role})</h3>
      <p className="muted">
        {['engineer', 'founder', 'marketing', 'qa'].map((r) => (
          <span key={r} style={{ marginRight: 8 }}>
            {r === role ? <strong>{r}</strong> : <a href={`${self}&role=${r}#understand`}>{r}</a>}
          </span>
        ))}
      </p>
      {tour.error !== undefined ? (
        <p className="muted">Tour unavailable: {tour.error}</p>
      ) : (
        tour.sections.map((s) => (
          <section key={s.heading} className="section">
            <h4>{s.heading}</h4>
            <p>{s.body}</p>
          </section>
        ))
      )}
      {tour.unknowns.length > 0 && (
        <p className="muted">Tour unknowns: {tour.unknowns.join('; ')}</p>
      )}
      <h3 id="quiz">Quiz ({quizzes.length} questions at this revision)</h3>
      {project === '' ? (
        <p className="muted">Open this run with <code>?project=…</code> to generate and answer questions.</p>
      ) : (
        <form method="POST" action="/api/quiz">
          <input type="hidden" name="project" value={project} />
          <input type="hidden" name="intent" value={intentId} />
          <input type="hidden" name="run" value={runId} />
          {repo !== '' ? <input type="hidden" name="repo" value={repo} /> : null}
          <button type="submit">Generate questions from verified findings</button>{' '}
          <span className="muted">Locate questions grade mechanically; open ones wait for a human.</span>
        </form>
      )}
      {quizzes.map((q) => (
        <section key={q.id} className="section">
          <h4>
            <span className={`badge ${q.status}`}>{q.type}</span> <code>{q.id}</code>{' '}
            <span className="muted">{q.status}</span>
          </h4>
          <p>{q.prompt}</p>
          {q.status === 'retired' ? (
            <p className="muted">Retired — the cited evidence moved. It no longer counts.</p>
          ) : (
            <form method="POST" action="/api/answer">
              <input type="hidden" name="project" value={project} />
              <input type="hidden" name="quiz" value={q.id} />
              <input type="hidden" name="run" value={runId} />
              {repo !== '' ? <input type="hidden" name="repo" value={repo} /> : null}
              <input type="text" name="actor" placeholder="Your name" required />{' '}
              <input type="text" name="text" placeholder={q.type === 'locate' ? 'file path and line range' : 'answer in your own words'} size={48} required />{' '}
              <button type="submit">Answer</button>
            </form>
          )}
          {responses.filter((r) => r.quiz_id === q.id).map((r) => (
            <div key={r.id}>
              <p className="evidence">
                {r.actor_id}: {r.response_text} — <span className={`badge ${r.graded}`}>{r.graded}</span>
                {r.graded_by !== undefined ? ` by ${r.graded_by}` : ''}
              </p>
              {r.graded === 'pending' && project !== '' ? (
                <form method="POST" action="/api/grade">
                  <input type="hidden" name="project" value={project} />
                  <input type="hidden" name="response" value={r.id} />
                  <input type="hidden" name="run" value={runId} />
                  {repo !== '' ? <input type="hidden" name="repo" value={repo} /> : null}
                  <input type="text" name="by" placeholder="Grader name" required />{' '}
                  <button type="submit" name="grade" value="pass">Pass</button>{' '}
                  <button type="submit" name="grade" value="fail">Fail</button>
                </form>
              ) : null}
            </div>
          ))}
        </section>
      ))}
    </>
  );
}

async function RunAsync({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const project = query['project'] ?? '';
  const repoDefault = query['repo'] ?? '';
  const root = workspaceRoot();
  const report = readReportFile(root, id) as {
    run_id: string;
    checked_revision: string;
    requirement_version_id: string;
    provider: string;
    model: string;
    created_at: string;
    results: Result[];
    orphans: Orphan[];
    test_runs?: RecordedTestRun[];
  } | null;
  if (report === null) {
    return (
      <main>
        <h1>Run not found</h1>
        <p className="muted">No stored report <code>{id}</code>.</p>
      </main>
    );
  }
  const reportFindingIds = new Set(report.results.map((r) => r.finding.id));
  const views = project === '' ? null : getViews(root, project);
  const packs: CorrectionPack[] = views === null
    ? []
    : Object.values(views.packs).filter((p: CorrectionPack) =>
        p.finding_ids.some((fid) => reportFindingIds.has(fid)),
      );
  const intent = views?.intents[report.requirement_version_id];
  const role = query['role'] ?? 'engineer';
  const quizzes = listQuizzes(root).filter(
    (q) => q.revision === report.checked_revision && (project === '' || q.project_id === project),
  );
  const quizIds = new Set(quizzes.map((q) => q.id));
  const responses = listResponses(root).filter((r) => quizIds.has(r.quiz_id));
  const testRuns = report.test_runs ?? [];
  const testRunById = new Map(testRuns.map((t) => [t.run.id, t]));
  return (
    <main>
      <h1>
        Run <code>{report.run_id.slice(0, 18)}…</code>
      </h1>
      <p className="muted">
        revision <code>{report.checked_revision.slice(0, 7)}</code> — intent{' '}
        <code>{report.requirement_version_id}</code> — {report.provider}/{report.model} — {report.created_at}
        {project !== '' ? (
          <>
            {' '}— <a href={`/handover?project=${encodeURIComponent(project)}&intent=${encodeURIComponent(report.requirement_version_id)}&run=${encodeURIComponent(report.run_id)}`}>team handover</a>
          </>
        ) : null}
      </p>
      <h2>Findings ({report.results.length})</h2>
      {report.results.map((r) => (
        <section key={r.criterion.id} className="section">
          <h3>
            <span className={`badge ${r.finding.finding}`}>{r.finding.finding}</span> {r.criterion.text}
          </h3>
          <p className="muted">
            grade {r.finding.evidence_grade} — confidence {r.finding.confidence}
          </p>
          <p>{r.finding.rationale}</p>
          <ul>
            {r.evidence.map((e) => (
              <li key={e.id} className="evidence">
                <code>{e.id}</code> [{e.tier}]{' '}
                {e.path !== undefined ? `${e.path}${e.line_start !== undefined ? `#L${e.line_start}-${e.line_end ?? e.line_start}` : ''}` : '(no path)'} — {e.description}
                {e.path !== undefined && repoDefault !== '' ? (
                  <>
                    {' '}<a href={`/evidence?run=${encodeURIComponent(report.run_id)}&evidence=${encodeURIComponent(e.id)}&repo=${encodeURIComponent(repoDefault)}`}>view source</a>
                  </>
                ) : null}
                {e.test_run_id !== undefined ? (
                  <>
                    {' '}<span className="evidence">test-backed: {testRunSummary(testRunById.get(e.test_run_id))}</span>
                  </>
                ) : null}
              </li>
            ))}
          </ul>
          {r.finding.missing_proof.length > 0 && (
            <p>Missing proof: {r.finding.missing_proof.join('; ')}</p>
          )}
          {r.adjudicatorNotes.length > 0 && (
            <p className="evidence">Adjudicator: {r.adjudicatorNotes.join(' | ')}</p>
          )}
        </section>
      ))}
      <h2>Test runs ({testRuns.length})</h2>
      {testRuns.length === 0 ? (
        <p className="muted">No test runs recorded for this verification — grades rest on source evidence alone (E1 at best).</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Command</th>
              <th>Exit</th>
              <th>Passed</th>
              <th>Failed</th>
              <th>Covers</th>
            </tr>
          </thead>
          <tbody>
            {testRuns.map((t) => (
              <tr key={t.run.id}>
                <td><code>{t.run.command.join(' ')}</code> <div className="evidence">{t.run.id}</div></td>
                <td>{t.run.exit_code}</td>
                <td>{t.run.passed}</td>
                <td>{t.run.failed}</td>
                <td className="evidence">{t.covers.join(', ') || 'nothing (no grade effect)'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <h2 id="packs">Correction packs ({packs.length})</h2>
      {project === '' ? (
        <p className="muted">Open this run with <code>?project=…</code> to generate and view correction packs.</p>
      ) : (
        <form method="POST" action="/api/fix">
          <input type="hidden" name="project" value={project} />
          <input type="hidden" name="run" value={report.run_id} />
          {repoDefault !== '' ? <input type="hidden" name="repo" value={repoDefault} /> : null}
          <button type="submit">Generate correction packs for failures</button>{' '}
          <span className="muted">Bounded guidance only — nothing is marked resolved.</span>
        </form>
      )}
      {packs.map((p) => (
        <section key={p.id} className="section">
          <h3><code>{p.id}</code></h3>
          <pre>{p.instructions}</pre>
          <p className="evidence">scope: {p.proposed_change_scope.join(', ')} | do_not_touch: {p.do_not_touch.join(', ')}</p>
          <p className="evidence">acceptance: {p.acceptance_commands.join(' && ')}</p>
        </section>
      ))}
      <h2>Re-verify after a patch</h2>
      <form method="POST" action="/api/recheck">
        <input type="hidden" name="project" value={project} />
        <input type="hidden" name="intent" value={report.requirement_version_id} />
        <p>
          <label>
            Repository directory{' '}
            <input type="text" name="repo" defaultValue={repoDefault} placeholder="C:\path\to\repo" size={48} required />
          </label>
        </p>
        <p>
          <label>
            Base revision (optional){' '}
            <input type="text" name="base" placeholder="base SHA for change detection" size={44} />
          </label>{' '}
          <button type="submit">Re-verify at current revision</button>
        </p>
        <p>
          <label>
            Acceptance command (optional, runs in the repo){' '}
            <input type="text" name="accept" placeholder="npm test" size={30} />
          </label>{' '}
          <label>
            Covers (comma paths this command exercises){' '}
            <input type="text" name="covers" placeholder="src/referral.js" size={30} />
          </label>
        </p>
        <p className="muted">Old findings go stale; the new verdict appears above with a fresh run id (before/after).</p>
      </form>
      <h2 id="understand">Understanding Studio</h2>
      {intent === undefined || intent === null ? (
        <p className="muted">Explanation needs the intent in this project ledger.</p>
      ) : (
        <UnderstandBlock
          project={project}
          intentId={intent.id}
          runId={report.run_id}
          repo={repoDefault}
          role={role}
          explanation={explainFeature(intent, report as unknown as VerificationReport)}
          tour={tourFor(project, role, intent, report as unknown as VerificationReport)}
          quizzes={quizzes}
          responses={responses}
        />
      )}
      <h2>Possibly unrequested changes ({report.orphans.length})</h2>
      {report.orphans.length === 0 ? (
        <p className="muted">None flagged.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Path</th>
              <th>Risk</th>
              <th>Why flagged</th>
              <th>Disposition</th>
            </tr>
          </thead>
          <tbody>
            {report.orphans.map((o) => (
              <tr key={o.id}>
                <td><code>{o.path}</code></td>
                <td><span className={`badge ${o.risk}`}>{o.risk}</span></td>
                <td>{o.why_flagged} <span className="evidence">({o.flags.join(', ')})</span></td>
                <td>{o.disposition ?? <span className="muted">pending — see Changes</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
