import type { VerificationReport } from '@buildbrief/verifier';
import SiteShell from '../components/SiteShell';
import RecoveryPlayground from '../components/RecoveryPlayground';
import { listRuns, readReportFile, workspaceRoot, readResetExample } from '../../lib/ledger';
import { readConnections } from '../../lib/connections';
import { projectParams } from '../../lib/context';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Try BuildBrief — a feature you can test' };

export default async function Demo({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const raw = await searchParams;
  const params = await projectParams(raw);
  const root = workspaceRoot();
  const selected = params['project'] ?? '';
  const scenario = raw['scenario'] === 'referral' || selected.startsWith('example-referral-') && raw['scenario'] !== 'reset' ? 'referral' : 'reset';
  const saved = readConnections(root).filter((c) => c.kind === 'example');
  const connection = saved.find((c) => c.project === selected && c.project.startsWith(`example-${scenario}-`)) ?? (raw['project'] ? undefined : saved.filter((c) => c.project.startsWith(`example-${scenario}-`)).at(-1));
  const project = connection?.project ?? '';
  const runs = connection ? listRuns(root).filter((r) => r.project === project).sort((a, b) => a.created.localeCompare(b.created)) : [];
  const before = runs[0] ? readReportFile(root, runs[0].id) as VerificationReport : null;
  const after = runs[1] ? readReportFile(root, runs[1].id) as VerificationReport : null;
  const reset = project ? readResetExample(root, project) : null;
  const runLink = (id: string) => `/run/${encodeURIComponent(id)}?${new URLSearchParams({ project, repo: connection?.repo ?? '' })}`;
  const testSummary = (report: VerificationReport | null) => report?.test_runs?.[0]?.run;
  const beforeTest = testSummary(before);
  const afterTest = testSummary(after);
  const beforeExpiry = before?.results.find((r) => /expire/i.test(r.criterion.text));
  const afterExpiry = after?.results.find((r) => /expire/i.test(r.criterion.text));
  return <SiteShell active="/demo">
    <header className="page-intro example-intro"><p className="section-kicker">No setup. No account. No paid API call.</p>
      <h1>{scenario === 'reset' ? <>The screen looked right.<br />The rule was missing.</> : <>A small feature.<br />An easy-to-miss requirement.</>}</h1>
      <p className="lede">{scenario === 'reset' ? 'A password-reset link should stop working after 30 minutes. Try the original build and the corrected one. Then see the evidence behind the difference.' : 'Referral credit is implemented, but the code never establishes expiry. Follow the original check, the correction, and the fresh test result.'}</p>
    </header>
    <nav className="example-tabs" aria-label="Choose an example"><a href="/demo?scenario=reset" aria-current={scenario === 'reset' ? 'page' : undefined}>Password recovery</a><a href="/demo?scenario=referral" aria-current={scenario === 'referral' ? 'page' : undefined}>Referral credit</a></nav>
    {params['error'] && <div className="notice error" role="alert">{params['error']}</div>}
    {!after && <section className="example-start"><div><h2>{scenario === 'reset' ? 'Meet Lighthouse, our example app.' : 'Open the referral example.'}</h2><p>{scenario === 'reset' ? 'We prepared a tiny recovery flow with a deliberately omitted rule. BuildBrief will check it, apply the supplied correction in an isolated copy, and test it again. You can then try both versions yourself.' : 'BuildBrief will create a local example repository, check the original implementation, and recheck the supplied correction with its acceptance test.'}</p><p className="evidence">These are deliberately seeded test conditions, not organic AI output or a claim about how often AI makes this mistake. Your own repositories are not changed.</p></div><form method="POST" action="/api/example"><input type="hidden" name="scenario" value={scenario} /><button type="submit">Run the working example</button></form></section>}
    {reset && <RecoveryPlayground example={reset} />}
    {before && after && <>
      <section className="acceptance-story"><div><p className="section-kicker">What changed</p><h2>Same requirement.<br />A different result.</h2><p>The original build and the correction were checked at different saved versions. The same acceptance test was used to assess the correction.</p></div>
        <div className="acceptance-comparison demo-comparison">
          <section><span className="build-label">Original build</span><h3>{scenario === 'reset' ? 'The expiry rule was not enforced.' : 'Expiry wasn’t established.'}</h3><p className="evidence">{beforeTest ? `${beforeTest.failed} of ${beforeTest.passed + beforeTest.failed} recorded checks failed.` : 'The original report relies on source evidence.'}</p><p><a href={runLink(before.run_id)}>Inspect the original report</a></p><span className={`badge ${beforeExpiry?.finding.finding}`}>{beforeExpiry?.finding.finding}</span></section>
          <section><span className="build-label">Corrected build</span><h3>{scenario === 'reset' ? 'Old and reused links are blocked.' : 'Expiry has fresh test evidence.'}</h3><p className="evidence">{afterTest ? `${afterTest.passed} of ${afterTest.passed + afterTest.failed} recorded checks passed.` : 'Read the report for the available evidence.'}</p><p><a href={runLink(after.run_id)}>Inspect the recheck and test output</a></p><span className={`badge ${afterExpiry?.finding.finding}`}>{afterExpiry?.finding.finding}</span>{' '}<span className="badge">{afterExpiry?.finding.evidence_grade}</span></section>
        </div>
      </section>
      <div className="example-complete" role="status"><p>The example ran. Its checks and source citations are stored in the local workspace.</p><a className="cta" href={runLink(after.run_id)}>Open the acceptance brief</a><a href={`/workspace?project=${encodeURIComponent(project)}`}>View example project</a></div>
      <details className="technical-details"><summary>How this example works</summary><p>The fixture versions are deliberate test conditions. BuildBrief uses its rules-based provider, stores reports at each Git revision, and records the actual acceptance-command output. This makes no external AI calls and changes no real user account.</p>{scenario === 'reset' && <p>The interactive controls execute the allowlisted source from the selected fixture commit with a synthetic clock. Expiry is this example’s requested policy; the sample is not a full authentication system.</p>}<form method="POST" action="/api/example"><input type="hidden" name="scenario" value={scenario} /><button className="secondary" type="submit">Run a fresh example</button></form></details>
    </>}
    <section className="site-section learning-next"><div><p className="section-kicker">Beyond finding the gap</p><h2>Know what to ask for next.<br />Understand why it matters.</h2></div><p>Open the brief to follow each requirement to its evidence, prepare a bounded request for your coding agent, or explore the feature through a founder, engineering, QA, or marketing explanation. Learning questions use the source behind that check.</p></section>
    <section className="site-closing"><div><h2>Now bring your own product.</h2><p>Connect a repository and write one thing it should do.</p></div><a className="cta" href="/connect?project=&method=github">Connect a project</a></section>
  </SiteShell>;
}
