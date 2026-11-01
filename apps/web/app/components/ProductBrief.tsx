import type { ReviewDecision } from '@buildbrief/domain';
import { findingLanguage, proofLanguage } from '../../lib/presentation';

interface BriefResult { criterion: { id: string; text: string }; finding: { finding: string; evidence_grade: string }; evidence: { path?: string }[] }
export default function ProductBrief({ results, project, run, repo, revision, decisions, failedTests, reviewError }: {
  results: BriefResult[]; project: string; run: string; repo: string; revision: string; decisions: ReviewDecision[]; failedTests: boolean; reviewError?: string | undefined;
}) {
  const questions = results.filter((r) => r.finding.finding !== 'supported' && r.finding.finding !== 'not_applicable');
  const params = new URLSearchParams({ project, repo, view: 'technical' });
  const technicalLink = (anchor: string) => `/run/${encodeURIComponent(run)}?${params}#${anchor}`;
  const latest = decisions.at(-1);
  const outcomeLabel: Record<string, string> = { accepted: 'Accepted by the reviewer', changes_requested: 'Changes requested', more_evidence: 'More evidence requested' };
  return <>
    <section className="product-brief" aria-label="Product acceptance brief">
      <p className="section-kicker">Your acceptance brief</p><h2>{questions.length ? 'There are still questions to resolve.' : 'Evidence is available for each requirement.'}</h2>
      <p>This is a check of one saved version. Review what it establishes, decide what needs to happen next, and keep the decision with the evidence.</p>
      {failedTests && <div className="notice error" role="status"><strong>A recorded acceptance check failed.</strong><p>Read the test output before accepting this version. Source matches alone do not establish that the tested behavior works. Historical findings remain as originally recorded.</p></div>}
      <ul className="brief-requirements">{results.map((r) => <li key={r.criterion.id}><strong>{r.criterion.text}</strong><span className={`badge ${r.finding.finding}`}>{findingLanguage(r.finding.finding).label}</span><p>{findingLanguage(r.finding.finding).explanation} <span className="explain-terms">{proofLanguage(r.finding.evidence_grade)}.</span></p></li>)}</ul>
      <p className="simple-next">{questions.length ? 'Next: review the open questions with your coding agent. A correction brief will keep the request focused. Then check the next saved version.' : 'Next: review the linked proof and any changes outside the brief. The decision to accept this version remains yours.'}</p>
      <div className="brief-actions"><a className="button" href={technicalLink('findings')}>Inspect the evidence</a>{questions.length > 0 && <form method="POST" action="/api/fix"><input type="hidden" name="project" value={project} /><input type="hidden" name="run" value={run} /><input type="hidden" name="repo" value={repo} /><button className="secondary" type="submit">Prepare a correction brief</button></form>}<a href={technicalLink('understand')}>Understand this feature</a></div>
      <p className="evidence">A source citation is not proof of live behavior. A recorded test establishes only what that test exercised. You can inspect the complete technical result below.</p>
    </section>
    <section id="review-decision" className="product-brief review-decision"><p className="section-kicker">The decision stays yours</p><h2>Record your review.</h2><p>Accept this saved version, request changes, or ask for more evidence. This records a human decision; it does not change the check’s findings.</p>
      {reviewError && <div className="notice error" role="alert">{reviewError}</div>}
      {latest && <div className="notice" role="status"><strong>{outcomeLabel[latest.outcome]}</strong><p>{latest.actor}: {latest.note}</p><p className="evidence">Recorded for this report’s saved version. Earlier decisions stay in history.</p></div>}
      <details><summary>{latest ? 'Record a new decision' : 'Add a review decision'}</summary><form method="POST" action="/api/review"><input type="hidden" name="run" value={run} /><label>Your name<input name="actor" type="text" required maxLength={120} placeholder="Name of the reviewer" /></label><label>Review outcome<select name="outcome" defaultValue="more_evidence"><option value="more_evidence">Ask for more evidence</option><option value="changes_requested">Request changes</option><option value="accepted">Accept this version, including any known gaps</option></select></label><label>Reason for your decision<textarea name="note" required maxLength={2000} rows={3} placeholder="What did you review, and what should happen next?" /></label><button type="submit">Record review decision</button><p className="evidence">This local app records the name entered; it does not authenticate identity. Acceptance applies to revision <code>{revision.slice(0, 7)}</code>, not future changes.</p></form></details>
      {decisions.length > 1 && <details className="technical-details"><summary>Earlier decisions for this version</summary><ul>{decisions.slice(0, -1).map((d, i) => <li key={`${d.at}-${i}`}>{outcomeLabel[d.outcome]} · {d.actor} · {d.note}</li>)}</ul></details>}
    </section>
  </>;
}
