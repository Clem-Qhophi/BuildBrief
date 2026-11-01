import type { ReactNode } from 'react';
import type { AtlasRun, AtlasCriterion } from '../../lib/atlas';
import { findingLanguage } from '../../lib/presentation';

type SavedExample = { project: string; before: AtlasRun; after: AtlasRun };

function focalCriterion(run: AtlasRun): AtlasCriterion | undefined {
  return run.criteria.find((criterion) => /expir/i.test(criterion.text)) ?? run.criteria[0];
}

function verdictClass(status: string | undefined): string {
  if (status === 'supported') return 'is-supported';
  if (status === 'partial') return 'is-partial';
  if (status === 'contradicted') return 'is-contradicted';
  return 'is-unestablished';
}

function EvidenceNode({ className, label, children }: { className: string; label: string; children: ReactNode }) {
  return <article className={`home-network-node ${className}`}><span>{label}</span>{children}</article>;
}

export default function HomeEvidenceNetwork({ example }: { example: SavedExample | null }) {
  if (!example) {
    return <section className="home-network home-network-empty" aria-labelledby="home-network-title">
      <header className="home-network-header"><div><span>THE BUILD BRIEF, CONNECTED</span><h2 id="home-network-title">A promise should have a path to proof.</h2></div><span className="network-mode">How it connects</span></header>
      <div className="home-network-canvas">
        <svg className="home-network-wires" viewBox="0 0 1000 520" preserveAspectRatio="none" aria-hidden="true"><path className="wire-promise" d="M290 270H370M630 245C670 220 685 120 720 120M630 295C670 320 685 390 720 390M845 165C845 300 700 430 600 450" /><path className="wire-unresolved" d="M845 420C770 445 700 450 600 450" /></svg>
        <EvidenceNode className="node-promise" label="01 · YOUR REQUEST"><strong>What should happen for the person using it?</strong><small>Capture the promise before the repository exists.</small></EvidenceNode>
        <EvidenceNode className="node-build" label="02 · THE BUILD"><strong>Your coding agent’s work</strong><small>Joined to the same reviewed brief.</small></EvidenceNode>
        <EvidenceNode className="node-source" label="03 · THE SOURCE"><strong>Which code supports the promise?</strong><small>Open the cited file and lines.</small></EvidenceNode>
        <EvidenceNode className="node-checks" label="04 · THE CHECKS"><strong>What actually ran?</strong><small>See the command, result, and limits.</small></EvidenceNode>
        <EvidenceNode className="node-verdict is-unestablished" label="05 · YOUR CALL"><strong>Accept, ask, or investigate.</strong><small>The finding never decides for you.</small></EvidenceNode>
      </div>
      <footer className="home-network-footer"><p>No report is loaded yet. Open the working example to see real saved evidence.</p><a href="/demo?scenario=reset">Follow a real example</a></footer>
    </section>;
  }

  const { before, after, project } = example;
  const criterion = focalCriterion(before);
  const corrected = criterion ? after.criteria.find((item) => item.id === criterion.id) : undefined;
  const source = criterion?.sources[0];
  const test = before.tests[0];
  const afterTest = after.tests[0];
  const beforeLanguage = findingLanguage(criterion?.status ?? 'not_established');

  return <section className="home-network home-network-report" aria-labelledby="home-network-title">
      <header className="home-network-header">
      <div><span>ONE REQUIREMENT · TWO SAVED VERSIONS</span><h2 id="home-network-title">A familiar feature. A promise still unproven.</h2></div>
      <span className="network-mode">Seeded · rules-based</span>
    </header>
    <div className="home-network-canvas">
        <svg className="home-network-wires" viewBox="0 0 1000 520" preserveAspectRatio="none" aria-hidden="true">
        <defs><marker id="home-arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0 0 8 4 0 8z" /></marker></defs>
        <path className="wire-promise" d="M290 260H350" markerEnd="url(#home-arrow)" />
        <path className="wire-branch" d="M600 250C650 230 650 80 700 80" markerEnd="url(#home-arrow)" /><path className="wire-branch" d="M600 270H700" markerEnd="url(#home-arrow)" />
        <path className="wire-unresolved" d="M845 125C845 220 760 300 700 365" markerEnd="url(#home-arrow)" /><path className="wire-unresolved" d="M845 310C835 345 760 390 700 410" markerEnd="url(#home-arrow)" />
        <path className={`wire-correction ${verdictClass(corrected?.status)}`} d="M845 455V472H350" markerEnd="url(#home-arrow)" />
        <circle className="wire-junction" cx="475" cy="260" r="4" />
        <circle className="wire-junction" cx="845" cy="80" r="3" />
        <circle className="wire-junction" cx="845" cy="255" r="3" />
      </svg>
      <span className="network-lane-label lane-correction">NEW SAVED VERSION · CHECKED AGAIN</span>
      <EvidenceNode className="node-promise" label="THE APPROVED PROMISE">
        <strong>{criterion?.text ?? 'The approved requirement is unavailable.'}</strong>
        <small>The brief is kept with the project before code changes.</small>
      </EvidenceNode>
      <EvidenceNode className="node-build" label="THE ORIGINAL BUILD">
        <strong>Password recovery</strong>
        <small>Checked revision <code>{before.revision.slice(0, 7)}</code></small>
      </EvidenceNode>
      <EvidenceNode className="node-source" label="CODE WE CAN POINT TO">
        <strong>{source ? <a href={source.href}>{source.path}{source.lines ? ` · ${source.lines}` : ''}</a> : 'No source citation recorded'}</strong>
        <small>{criterion?.proof ?? 'Source evidence unavailable'}</small>
      </EvidenceNode>
      <EvidenceNode className="node-checks" label="RECORDED CHECKS">
        <strong>{test?.command ?? 'No command recorded'}</strong>
        {test ? <div className="network-check-counts"><span>{test.passed} passed</span><span className={test.failed > 0 ? 'has-failures' : ''}>{test.failed} failed</span><small>exit {test.exit}</small></div> : <small>No recorded execution evidence.</small>}
      </EvidenceNode>
      <article className={`home-network-verdict ${verdictClass(criterion?.status)}`}>
        <span>WHAT WE CAN SAY</span>
        <strong>{criterion?.label ?? 'No finding recorded'}</strong>
        <p>{beforeLanguage.explanation}</p>
        <a href={before.reportHref}>Review the original report</a>
      </article>
    </div>
    <div className="home-network-correction">
      <div className="correction-heading"><span>AFTER THE EXAMPLE CORRECTION</span><small>New saved version <code>{after.revision.slice(0, 7)}</code></small></div>
      {afterTest ? <div className="correction-checks"><strong>{afterTest.passed} passed</strong><span className={afterTest.failed > 0 ? 'has-failures' : ''}>{afterTest.failed} failed</span><span>exit {afterTest.exit}</span></div> : <p>No corrected check is recorded.</p>}
      <span className={`correction-verdict ${verdictClass(corrected?.status)}`}>{corrected?.label ?? 'No corrected finding'}</span>
      <a href={`/run/${encodeURIComponent(before.id)}?project=${encodeURIComponent(project)}&repo=${encodeURIComponent(before.repo)}`}>Inspect both saved reports</a>
    </div>
    <div className="home-network-try">
      <div><strong>Try the saved behavior</strong><p>Would a recovery link sent 31 minutes ago still open?</p></div>
      <form method="POST" action="/api/example/probe">
        <input type="hidden" name="project" value={project} />
        <input type="hidden" name="version" value="before" />
        <input type="hidden" name="return" value="home" />
        <label htmlFor="home-probe-age">Link age</label>
        <select id="home-probe-age" name="age" defaultValue="31"><option value="5">5 minutes</option><option value="30">30 minutes</option><option value="31">31 minutes</option></select>
        <button type="submit">Run the check</button>
      </form>
      <p className="home-network-try-note">Runs the example code with a simulated account and clock.</p>
    </div>
  </section>;
}

export function HandoffBridge({ run }: { run: AtlasRun | null }) {
  const criterion = run ? focalCriterion(run) : undefined;
  const source = criterion?.sources[0];
  const test = run?.tests[0];
  return <section className="handoff-bridge" aria-labelledby="handoff-title">
    <header><span>Product view · engineering view</span><h2 id="handoff-title">Understand the result. Inspect the reason.</h2><p>Read the requirement and finding in plain language. Follow the source citation and recorded test when you need to see how the result was reached.</p></header>
    <div className="handoff-views">
      <article className="handoff-view handoff-view-product"><div className="handoff-view-top"><span>Product view</span><span className={`verdict-mark ${verdictClass(criterion?.status)}`}>{criterion?.label ?? 'No saved finding'}</span></div><h3>{criterion?.text ?? 'Your approved requirement'}</h3><p>{criterion ? `${criterion.proof}. ${findingLanguage(criterion.status).explanation}` : 'Capture an idea or load the example to see a saved requirement and its result.'}</p><a href={run?.reportHref ?? '/start'}>{run ? 'Open the product report' : 'Start with an idea'}</a></article>
      <article className="handoff-view handoff-view-technical"><div className="handoff-view-top"><span>Engineering view</span><span>{run ? `Saved at ${run.revision.slice(0, 7)}` : 'Opens after a check'}</span></div><p className="handoff-code-path"><span>Source</span><code>{source ? `${source.path} ${source.lines}` : 'No source citation'}</code></p><p className="handoff-code-path"><span>Test command</span><code>{test?.command ?? 'No recorded test command'}</code></p><p className="handoff-test-outcome">{test ? <><strong>{test.passed} passed</strong><strong className={test.failed ? 'has-failures' : ''}>{test.failed} failed</strong><span>exit {test.exit}</span></> : <span>Runtime evidence has not been recorded.</span>}</p><a href={run?.reportHref ?? '/demo?scenario=reset'}>{run ? 'Open the technical report' : 'See a real technical report'}</a></article>
    </div>
  </section>;
}
