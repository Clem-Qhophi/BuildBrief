import AppShell from '../../components/AppShell';
import ProductBrief from '../../components/ProductBrief';
import TraceAtlas from '../../components/TraceAtlas';
import { atlasFromReport } from '../../../lib/atlas';
import { summarizeReport } from '../../../lib/assurance';
import { projectParams } from '../../../lib/context';
import type { CorrectionPack, IntentVersion } from '@buildbrief/domain';
import type { VerificationReport } from '@buildbrief/verifier';
import { explainFeature, roleTour } from '@buildbrief/learning';
import { getViews, listQuizzes, listResponses, listRuns, listReviewDecisions, readReportFile, workspaceRoot } from '../../../lib/ledger';
import EvidenceStrand from '../../components/EvidenceStrand';

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
  const self = `?view=technical&project=${encodeURIComponent(project)}${repo !== '' ? `&repo=${encodeURIComponent(repo)}` : ''}`;
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
              <label>Your name <input type="text" name="actor" placeholder="Your name" required /></label>{' '}
              <label>Your answer <input type="text" name="text" placeholder={q.type === 'locate' ? 'file path and line range' : 'answer in your own words'} size={48} required /></label>{' '}
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
                  <label>Grader name <input type="text" name="by" placeholder="Grader name" required /></label>{' '}
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
  let query = await projectParams(await searchParams);
  const root = workspaceRoot();
  const report = readReportFile(root, id) as {
    project_id: string;
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
      <AppShell active="runs" context={query}>
        <h1>Run not found</h1>
        <p className="muted">No stored report <code>{id}</code>.</p>
        <p><a href="/runs">Open Checks &amp; evidence</a> to choose a stored run, or <a href="/workspace">open the project overview</a>.</p>
      </AppShell>
    );
  }
  query = await projectParams({ ...await searchParams, project: report.project_id });
  const project = query['project'] ?? '';
  const repoDefault = query['repo'] ?? '';
  const reportFindingIds = new Set(report.results.map((r) => r.finding.id));
  const views = project === '' ? null : getViews(root, project);
  const packs: CorrectionPack[] = views === null
    ? []
    : Object.values(views.packs).filter((p: CorrectionPack) =>
        p.finding_ids.some((fid) => reportFindingIds.has(fid)),
      );
  const intent = views?.intents[report.requirement_version_id];
  const role = query['role'] ?? 'engineer';
  const decisions = listReviewDecisions(root, project, report.run_id);
  const technicalQuery = new URLSearchParams({ project, repo: repoDefault, view: 'technical' });
  const quizzes = listQuizzes(root).filter(
    (q) => q.revision === report.checked_revision && (project === '' || q.project_id === project),
  );
  const quizIds = new Set(quizzes.map((q) => q.id));
  const responses = listResponses(root).filter((r) => quizIds.has(r.quiz_id));
  const testRuns = report.test_runs ?? [];
  const testRunById = new Map(testRuns.map((t) => [t.run.id, t]));
  // Revision comparison: previous stored report for the same intent, if any.
  // Labels compare verdict ranks only — a new revision alone proves nothing.
  const RANK: Record<string, number> = {
    contradicted: 0, not_established: 1, not_applicable: 1, partial: 2, supported: 3,
  };
  const prevRun = listRuns(root)
    .filter((r) => r.intent === report.requirement_version_id && r.id !== report.run_id && r.created < report.created_at)
    .sort((a, b) => (a.created < b.created ? 1 : -1))[0];
  const prevReport = prevRun === undefined
    ? null
    : (readReportFile(root, prevRun.id) as { checked_revision: string; results: Result[] } | null);
  const KIND_BADGE: Record<string, string> = {
    improved: 'supported', regressed: 'contradicted', unchanged: '', new: 'medium',
  };
  const deltas = prevReport === null
    ? []
    : report.results.map((r) => {
      const prev = prevReport.results.find((p) => p.criterion.id === r.criterion.id);
      if (prev === undefined) return { criterion: r.criterion.text, kind: 'new', from: '—', to: r.finding.finding };
      const d = (RANK[r.finding.finding] ?? 1) - (RANK[prev.finding.finding] ?? 1);
      return {
        criterion: r.criterion.text,
        kind: d > 0 ? 'improved' : d < 0 ? 'regressed' : 'unchanged',
        from: prev.finding.finding,
        to: r.finding.finding,
      };
    });
  return (
    <AppShell active="runs" context={query}>
      <p className="breadcrumb"><a href={`/workspace?project=${encodeURIComponent(project)}`}>Project overview</a> / Acceptance brief</p>
      <h1>{intent?.feature_id ?? 'Feature'}: acceptance brief</h1>
      <p className="lede">What you asked for, what this version establishes, and the decision you want to make next.</p>
      <p className="evidence">{report.provider === 'rules' ? 'Rules-based check · no model assessment' : `${report.provider} assessment · ${report.model}`} · Saved version <code>{report.checked_revision.slice(0, 7)}</code>. This report describes that version; later edits need a new check.</p>
      <details className="coverage-block">
        <summary>Coverage of this check</summary>
        {(() => {
          const coverage = summarizeReport(report as unknown as VerificationReport);
          return (
            <ul>
              <li>{coverage.supported} of {coverage.criteria} requirements established{coverage.partial > 0 ? `, ${coverage.partial} partly covered` : ''}{coverage.contradicted > 0 ? `, ${coverage.contradicted} contradicted` : ''}{coverage.unproven > 0 ? `, ${coverage.unproven} unproven` : ''}.</li>
              <li>{coverage.evidence} evidence references across {coverage.files.length} cited file{coverage.files.length === 1 ? '' : 's'}{coverage.files.length > 0 ? `: ${coverage.files.slice(0, 8).join(', ')}${coverage.files.length > 8 ? ', …' : ''}` : ''}.</li>
              <li>{coverage.testRuns.length === 0 ? 'No acceptance command was recorded — grades rest on source evidence alone.' : coverage.testRuns.map((t, i) => <span key={i}>{t.command}: exit {t.exit}, {t.passed} passed, {t.failed} failed. </span>)}</li>
              <li>{coverage.staleEvidence === 0 ? 'No stale evidence.' : `${coverage.staleEvidence} stale evidence reference${coverage.staleEvidence === 1 ? '' : 's'} — re-verify to refresh.`}</li>
              {coverage.coverageGaps.length > 0 && <li>Search gaps: {coverage.coverageGaps.join('; ')}.</li>}
              <li>Checked by {coverage.provider === 'rules' ? 'the rules engine (no model)' : `${coverage.provider} ${coverage.model}`} at {coverage.createdAt}.</li>
            </ul>
          );
        })()}
      </details>
      <nav className="report-nav" aria-label="Report view"><a href={`/run/${encodeURIComponent(report.run_id)}?project=${encodeURIComponent(project)}`} aria-current={query['view'] !== 'technical' ? 'page' : undefined}>Product view</a><a href={`/run/${encodeURIComponent(report.run_id)}?${technicalQuery}#technical-evidence`} aria-current={query['view'] === 'technical' ? 'page' : undefined}>Technical view</a></nav>
      <TraceAtlas before={atlasFromReport(report, repoDefault)} project={project} journey={false} />
      <ProductBrief results={report.results} project={project} run={report.run_id} repo={repoDefault} revision={report.checked_revision} decisions={decisions} failedTests={testRuns.some((t) => t.run.exit_code !== 0 || t.run.failed > 0)} reviewError={query['review_error']} />
      <details id="technical-evidence" className="technical-section" open={query['view'] === 'technical'}><summary>Technical evidence & tools</summary>
      <p className="muted">
        revision <code>{report.checked_revision.slice(0, 7)}</code> — {report.provider === 'rules' ? 'Rules-based' : report.provider}/{report.model} — {report.created_at}
        {' '}— <a href={`/intent/${encodeURIComponent(report.requirement_version_id)}?project=${encodeURIComponent(project)}`}>approved brief</a>
        {project !== '' ? (
          <>
            {' '}— <a href={`/handover?project=${encodeURIComponent(project)}&intent=${encodeURIComponent(report.requirement_version_id)}&run=${encodeURIComponent(report.run_id)}`}>team handover</a>
          </>
        ) : null}
      </p>
      <nav className="report-nav" aria-label="Report sections"><a href="#findings">Findings</a><a href="#tests">Test evidence</a><a href="#packs">Correction brief</a><a href="#recheck">Recheck</a><a href="#understand">Understand</a><a href="#changes">Changes</a></nav>
      <ol className="steps">
        <li className="done">1 · Connect repository</li>
        <li className="done">2 · Describe what to build</li>
        <li className="done">3 · Approve requirements</li>
        <li className="now">4 · Verify implementation</li>
        <li>5 · Fix and recheck</li>
      </ol>
      <h2>Evidence strand</h2>
      <p className="lede">
        Follow each thread from what was requested, through the evidence actually cited, to the verdict it earned.
        A dashed thread ending in “no citation yet” is an honest gap, not a failure of the drawing. Select a criterion to open its rationale.
      </p>
      <EvidenceStrand
        runId={report.run_id}
        repo={repoDefault}
        rows={report.results.map((r) => ({
          criterionId: r.criterion.id,
          text: r.criterion.text,
          finding: r.finding.finding,
          grade: r.finding.evidence_grade,
          rationale: r.finding.rationale,
          missing: r.finding.missing_proof,
          stale: false,
          evidence: r.evidence.map((e) => ({
            id: e.id,
            tier: e.tier,
            ...(e.path !== undefined ? { path: e.path } : {}),
            ...(e.line_start !== undefined ? { lineStart: e.line_start } : {}),
            ...(e.line_end !== undefined ? { lineEnd: e.line_end } : {}),
            description: e.description,
            testBacked: e.test_run_id !== undefined,
          })),
        }))}
      />
      <h2 id="findings">Findings ({report.results.length})</h2>
      <p className="lede">
        {report.results.filter((r) => r.finding.finding === 'supported').length} of {report.results.length} criteria
        established · {report.results.filter((r) => r.finding.finding === 'partial' || r.finding.finding === 'contradicted').length} need
        attention · {report.results.filter((r) => r.finding.finding !== 'supported' && r.finding.finding !== 'partial' && r.finding.finding !== 'contradicted').length} unproven.
        Open a finding to see the evidence behind it.
      </p>
      {report.results.map((r) => (
        <details
          key={r.criterion.id}
          className="finding"
          open={r.finding.finding !== 'supported'}
        >
          <summary>
            <h3>
              <span className={`badge ${r.finding.finding}`}>{r.finding.finding}</span> {r.criterion.text}
            </h3>
          </summary>
          <div className="finding-body">
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
          </div>
        </details>
      ))}
      <h2>Changes since the previous check</h2>
      {prevRun === undefined || prevReport === null ? (
        <div className="empty">This is the first recorded check for this intent — nothing to compare yet. After the next <a href="#recheck">recheck</a>, changes since this check will appear here.</div>
      ) : (
        <>
          <p className="lede">
            Revision <code>{prevReport.checked_revision.slice(0, 7)}</code> →{' '}
            <code>{report.checked_revision.slice(0, 7)}</code>. Labels compare
            verdicts only — a new revision alone proves nothing was fixed.
          </p>
          <ul className="queue">
            {deltas.map((d) => (
              <li key={d.criterion}>
                <span className={`badge ${KIND_BADGE[d.kind] ?? ''}`}>{d.kind}</span>{' '}
                {d.criterion}
                <span className="evidence"> — {d.from} → {d.to}</span>
              </li>
            ))}
          </ul>
        </>
      )}
      <h2 id="tests">Test runs ({testRuns.length})</h2>
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
      <ol className="steps">
        <li className="done">1 · Connect repository</li>
        <li className="done">2 · Describe what to build</li>
        <li className="done">3 · Approve requirements</li>
        <li className="done">4 · Verify implementation</li>
        <li className="now">5 · Fix and recheck</li>
      </ol>
      <div className="notice">
        Before rechecking: commit your fix in the repository, note the new
        revision hash, and optionally name an acceptance command with the paths
        it exercises — passing runs upgrade source evidence to test-backed (E2).
      </div>
      <h2 id="recheck">Re-verify after a patch</h2>
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
        <p className="muted">Explanation needs the intent in this project ledger. <a href={`/workspace?project=${encodeURIComponent(project)}`}>Open the project overview</a> to choose the project this report belongs to.</p>
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
      <h2 id="changes">Possibly unrequested changes ({report.orphans.length})</h2>
      {report.orphans.length === 0 ? (
        <p className="muted">None flagged — no action needed. A future check run with a base revision will list any new drift here.</p>
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
      </details>
    </AppShell>
  );
}
