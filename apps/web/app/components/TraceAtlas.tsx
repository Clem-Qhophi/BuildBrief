'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useMotionValueEvent, useReducedMotion, useScroll } from 'motion/react';
import { ATLAS_CHAPTERS, ATLAS_NODES, atlasChapter, type AtlasNode, type AtlasRun } from '../../lib/atlas';
import type { ProbeResult } from '../../lib/reset-example';
import '../atlas.css';

function NodeIcon({ node }: { node: AtlasNode }) {
  const paths: Record<AtlasNode, string> = { request: 'M6 3h9l3 3v15H6V3Zm3 5h6M9 12h6M9 16h4', product: 'M4 5h16v13H4V5Zm4 16h8M9 18v3m6-3v3', source: 'm8 6-6 6 6 6m8-12 6 6-6 6M14 3l-4 18', tests: 'm4 12 5 5L20 6M3 3h6M15 21h6', decision: 'M5 4h14v17H5V4Zm3-2h8v4H8V2Zm0 10 3 3 5-6', understand: 'M8 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm8-1a3 3 0 1 0 0-6M1 21v-3a5 5 0 0 1 10 0v3m3-8a5 5 0 0 1 7 5v3' };
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[node]} /></svg>;
}

export default function TraceAtlas({ before, after, project, probe = null, initialVersion = 'before', journey = true }: {
  before: AtlasRun; after?: AtlasRun | undefined; project: string; probe?: ProbeResult | null; initialVersion?: 'before' | 'after'; journey?: boolean;
}) {
  const region = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const [ready, setReady] = useState(false);
  const [wide, setWide] = useState(false);
  const [follow, setFollow] = useState(initialVersion === 'before');
  const [reading, setReading] = useState(false);
  const [chapter, setChapter] = useState(initialVersion === 'after' ? 3 : 0);
  const [version, setVersion] = useState<'before' | 'after'>(initialVersion);
  const [node, setNode] = useState<AtlasNode>(journey && !probe && initialVersion === 'before' ? 'request' : 'tests');
  const [criterionId, setCriterionId] = useState(before.criteria.find((c) => /expire/i.test(c.text))?.id ?? before.criteria[0]?.id ?? '');
  const { scrollYProgress } = useScroll({ target: region, offset: ['start start', 'end end'] });
  const cinematic = journey && ready && wide && !reduced && !reading;
  useEffect(() => {
    const query = window.matchMedia('(min-width: 761px)');
    const update = () => setWide(query.matches);
    update(); setReady(true); query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  useMotionValueEvent(scrollYProgress, 'change', (progress) => {
    if (!cinematic || !follow) return;
    const next = atlasChapter(progress);
    setChapter(next); setNode(ATLAS_CHAPTERS[next]!.node); setVersion(next >= 3 && after ? 'after' : 'before');
  });
  const run = version === 'after' && after ? after : before;
  const criterion = run.criteria.find((c) => c.id === criterionId) ?? run.criteria[0];
  const test = run.tests[0];
  const failed = run.tests.some((t) => t.exit !== 0 || t.failed > 0);
  const established = criterion?.status === 'supported' && !failed;
  const currentChapter = ATLAS_CHAPTERS[chapter]!;
  const duration = reduced || reading ? 0 : 0.5;
  function inspect(value: AtlasNode) { setFollow(false); setNode(value); if (journey) setChapter({ request: 0, product: 1, source: 3, tests: 2, decision: 3, understand: 4 }[value]); }
  function selectVersion(value: 'before' | 'after') { setFollow(false); setVersion(value); setNode('tests'); if (journey) setChapter(value === 'after' ? 3 : 2); }
  function goChapter(index: number) {
    setFollow(true); setChapter(index); setNode(ATLAS_CHAPTERS[index]!.node); setVersion(index >= 3 && after ? 'after' : 'before');
    const element = region.current;
    if (element && cinematic) window.scrollTo({ top: element.getBoundingClientRect().top + window.scrollY + Math.max(0, element.offsetHeight - innerHeight) * ((index + 0.5) / 5), behavior: 'instant' });
  }
  return <div className={`trace-experience ${journey ? 'trace-journey' : 'trace-report'} ${cinematic ? 'trace-cinematic' : 'trace-reading'}`} ref={region} data-atlas-mode={cinematic ? 'scroll' : 'explore'}>
    <div className="trace-sticky">
      {!journey && <h2 className="sr-only">Connected evidence for this report</h2>}
      {journey && <header className="trace-chapter-heading"><div><span className="trace-story-label">The idea stays connected.</span><h2>{currentChapter.title}</h2><p>{currentChapter.body}</p></div><div className="trace-story-controls">{ready && wide && !reduced && <button type="button" onClick={() => { setReading(!reading); setFollow(false); region.current?.scrollIntoView({ block: 'start' }); }}>{reading ? 'Follow with scroll' : 'Explore without scrolling'}</button>}{!follow && cinematic && <button type="button" onClick={() => setFollow(true)}>Follow the story</button>}</div></header>}
      <div className="trace-board" data-atlas-version={version} data-atlas-node={node}>
        <div className="trace-board-bar"><span className="trace-project"><span className="trace-project-glyph" aria-hidden="true">B</span>{journey ? 'Lighthouse / password recovery' : 'Your connected evidence'}</span><span className="trace-mode-label">{journey ? 'Seeded example' : 'Saved report'}<i aria-hidden="true" />{run.provider === 'rules' ? 'Rules-based' : run.provider}</span></div>
        <div className="trace-workspace">
          <div className={`trace-canvas ${established ? 'trace-established' : 'trace-open'}`}>
            <svg className="trace-wires" viewBox="0 0 1000 600" preserveAspectRatio="none" aria-hidden="true"><defs><pattern id={`trace-grid-${before.id}`} width="28" height="28" patternUnits="userSpaceOnUse"><path d="M13 14h2m-1-1v2" stroke="#788589" strokeWidth="0.5" opacity="0.35" /></pattern></defs><rect width="1000" height="600" fill={`url(#trace-grid-${before.id})`} />{[{ key: 'request', d: 'M150 300C280 300 360 300 490 300', phase: 0 }, { key: 'source', d: 'M490 300C650 300 660 144 830 144', phase: 1 }, { key: 'tests', d: 'M490 300C650 300 660 456 830 456', phase: 2 }, { key: 'decision', d: 'M490 84V300', phase: 3 }, { key: 'understand', d: 'M490 300V522', phase: 4 }].map((wire) => <g key={wire.key}><path d={wire.d} className="trace-wire-base" /><motion.path d={wire.d} className={`trace-wire-active ${node === wire.key || node === 'product' ? 'is-selected' : ''}`} initial={false} animate={{ pathLength: cinematic && follow && chapter < wire.phase ? 0 : 1, opacity: node === wire.key || node === 'product' ? 1 : 0.25 }} transition={{ duration }} /></g>)}</svg>
            <span className="trace-canvas-note">Select a connection to see what it means.</span>
            {ATLAS_NODES.map((item) => <motion.button type="button" key={item.id} className={`trace-node trace-node-${item.id} ${node === item.id ? 'is-selected' : ''}`} style={{ left: `${item.x}%`, top: `${item.y}%` }} aria-label={item.label} aria-pressed={node === item.id} disabled={!ready} onClick={() => inspect(item.id)} initial={false} animate={{ y: node === item.id ? -5 : 0, scale: node === item.id ? 1.035 : 1, rotateZ: item.id === 'product' && version === 'before' ? -2 : 0 }} transition={{ duration }}><span className="trace-node-icon"><NodeIcon node={item.id} /></span><span className="trace-node-label">{item.label}</span>{item.id === 'product' ? <><strong>{journey ? 'Password recovery' : 'This feature'}</strong><span className="trace-product-lines" aria-hidden="true">{run.criteria.map((c) => <i className={c.status === 'supported' ? 'is-supported' : ''} key={c.id} />)}</span><span className={`trace-node-state ${established ? 'is-supported' : 'is-question'}`}>{established ? 'Evidence connected' : 'A question remains'}</span></> : <small>{item.id === 'request' ? 'Owner-approved brief' : item.id === 'source' ? criterion?.sources[0]?.path ?? 'No citation yet' : item.id === 'tests' ? test ? failed ? 'A check failed' : 'Recorded checks passed' : 'No recorded test' : item.id === 'decision' ? 'The choice stays yours' : 'Explain it to your team'}</small>}</motion.button>)}
            <div className="trace-revision"><span className={`trace-signal ${established ? 'is-supported' : ''}`} />{established ? 'Fresh evidence at' : 'Checked version'} <code>{run.revision.slice(0, 7)}</code></div>
          </div>
          <aside className="trace-inspector" aria-label="Selected connection"><div className="trace-inspector-title"><NodeIcon node={node} /><span>{ATLAS_NODES.find((n) => n.id === node)?.label}</span><span className="trace-inspector-symbol" aria-hidden="true">↗</span></div>
            <label className="trace-requirement-picker">Follow a requirement<select value={criterion?.id ?? ''} onChange={(event) => { setCriterionId(event.target.value); setFollow(false); }}>{run.criteria.map((c) => <option key={c.id} value={c.id}>{c.text}</option>)}</select></label>
            <div className="trace-inspector-content" key={`${run.id}-${node}-${criterion?.id}`}>
              {probe && journey && node === 'tests' && probe.version === version && <div className="trace-observation" role="status"><span>Last executed check · {probe.ageMinutes} minutes old{probe.alreadyUsed ? ' · already used' : ''}</span><strong>{probe.allowed ? 'The recovery link opened.' : 'The recovery link was blocked.'}</strong><p>{probe.message}</p></div>}
              {node === 'request' && <><span className="trace-small-label">The original promise</span><h3>{criterion?.text}</h3><p>The owner’s approved requirement anchors the rest of the work. It is a decision, not something the coding agent can silently rewrite.</p><a href={run.briefHref}>Read the approved brief</a></>}
              {node === 'product' && <><span className="trace-small-label">A screen is only the beginning</span><h3>{criterion?.label ?? 'No requirement selected'}</h3><p>{criterion?.proof}. Follow the source and recorded checks before deciding whether to accept this version.</p><a href={run.reportHref}>Open the acceptance brief</a></>}
              {node === 'source' && <><span className="trace-small-label">Inspect the implementation</span><h3>{criterion?.label}</h3><p>{criterion?.proof}. A source reference is different from a behavior exercised by a test.</p><ul className="trace-source-list">{criterion?.sources.map((s) => <li key={s.id}><a href={s.href}><span>{s.path}</span><small>{s.lines}</small></a></li>)}</ul>{!criterion?.sources.length && <p>No source citation was established for this requirement.</p>}</>}
              {node === 'tests' && <><span className="trace-small-label">What actually ran</span><h3>{test ? failed ? 'The check found a gap.' : 'The recorded checks passed.' : 'Behavior still needs a test.'}</h3>{test ? <><code className="trace-command">{test.command}</code><div className="trace-test-result"><span><strong>{test.passed}</strong> passed</span><span className={test.failed ? 'test-failed' : ''}><strong>{test.failed}</strong> failed</span><span>exit {test.exit}</span></div><p>These results cover the recorded command and declared paths. They do not certify a production system.</p></> : <p>This report has no recorded acceptance command. Source citations alone do not establish runtime behavior.</p>}<a href={`${run.reportHref}&view=technical#tests`}>Inspect the recorded test</a>{journey && <details className="trace-probe"><summary>Try the actual link</summary><form method="POST" action="/api/example/probe"><input type="hidden" name="project" value={project} /><input type="hidden" name="version" value={version} /><input type="hidden" name="return" value="home" /><label>Link age<select name="age" defaultValue="31"><option value="5">5 minutes</option><option value="30">30 minutes</option><option value="31">31 minutes</option></select></label><button type="submit">Open the recovery link</button><p>Real fixture code. Simulated account and clock.</p></form></details>}</>}
              {node === 'decision' && <><span className="trace-small-label">Your acceptance record</span><h3>Evidence informs. You decide.</h3><p>Accept this saved version, ask for changes, or request stronger evidence. Your decision stays separate from the automated finding.</p><a href={`${run.reportHref}#review-decision`}>Record your review</a></>}
              {node === 'understand' && <><span className="trace-small-label">Beyond “it works”</span><h3>Make the product easier to own.</h3><p>Follow an explanation for your role. Answer a question grounded in the source. Understanding is assessed through actual answers, never a guessed score.</p><a href={run.understandHref}>Explore the explanation & questions</a></>}
            </div>
            <div className={`trace-finding ${established ? 'is-supported' : ''}`}><span className="trace-signal" /><span>{criterion?.label ?? 'No finding'}<small>{criterion?.proof}</small></span></div>
          </aside>
        </div>
        <div className="trace-board-footer"><a href={run.reportHref}>{journey ? 'Open the real example report' : 'Read the complete report'}</a>{after && <div className="trace-version-switch" role="group" aria-label="Compare builds"><button type="button" disabled={!ready} aria-pressed={version === 'before'} onClick={() => selectVersion('before')}>Original build</button><button type="button" disabled={!ready} aria-pressed={version === 'after'} onClick={() => selectVersion('after')}>Supplied correction</button></div>}</div>
      </div>
      {journey && <nav className="trace-chapters" aria-label="Connected story">{ATLAS_CHAPTERS.map((item, index) => <button key={item.label} type="button" disabled={!ready} onClick={() => goChapter(index)} aria-current={chapter === index ? 'step' : undefined}><span>0{index + 1}</span>{item.label}</button>)}</nav>}
      {cinematic && <div className="trace-scroll-track" aria-hidden="true"><motion.span style={{ scaleX: scrollYProgress, originX: 0 }} /></div>}
    </div>
    <details className="trace-readable-data"><summary>Read the evidence without the map</summary><p>{run.provider === 'rules' ? 'Rules-based findings' : run.provider} at saved version <code>{run.revision.slice(0, 7)}</code>. {journey && 'Deliberately seeded fixture; actual stored reports.'}</p><ul>{run.criteria.map((c) => <li key={c.id}><strong>{c.text}</strong><p>{c.label}. {c.proof}.</p>{c.sources.map((s) => <a key={s.id} href={s.href}>{s.path} {s.lines} </a>)}</li>)}</ul>{run.tests.map((t) => <p key={t.id}>{t.command}: exit {t.exit}; {t.passed} passed, {t.failed} failed.</p>)}</details>
    {!cinematic && journey && <ol className="trace-readable-story">{ATLAS_CHAPTERS.map((item) => <li key={item.label}><h3>{item.title}</h3><p>{item.body}</p></li>)}</ol>}
  </div>;
}
