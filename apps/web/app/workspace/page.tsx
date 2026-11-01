import AppShell from '../components/AppShell';
import { projectHref, projectParams } from '../../lib/context';
import { getViews, listProjects, listRuns, workspaceRoot } from '../../lib/ledger';
import { projectName } from '../../lib/presentation';

export const dynamic = 'force-dynamic';

export default function Home({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  return HomeAsync({ searchParams });
}

type Stage = 'draft' | 'attention' | 'established' | 'awaiting-check';

const STAGE_LABEL: Record<Stage, string> = {
  draft: 'Draft — needs owner review',
  attention: 'Needs attention',
  established: 'Established',
  'awaiting-check': 'Approved — awaiting first check',
};

async function HomeAsync({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const root = workspaceRoot();
  const params = await projectParams(await searchParams);
  if (listProjects(root).length === 0) {
    return (
      <AppShell active="workspace" context={params}>
        <h1>Welcome to Build Brief</h1>
        <p className="lede">
          Start with an idea, or bring code you already have. Keep your requirements,
          implementation evidence, and acceptance decisions connected.
        </p>
        <div className="onboarding-grid"><section className="card"><h2>I’m starting with an idea</h2><p>Describe the product, review the proposed requirements, and prepare an approved brief for your coding agent. No repository is needed yet.</p><p><a className="button" href="/start">Start with an idea</a></p></section><section className="card"><h2>I already have code</h2><p>Connect a public GitHub URL or a local folder, capture a feature, and check the implementation against its requirements.</p><p><a className="button secondary" href="/connect?project=&method=github">Connect a project</a></p></section></div>
        <p><a href="/demo?scenario=reset">Try the working example first</a> if you’d like to see a complete check.</p>
      </AppShell>
    );
  }
  const projects = listProjects(root);
  const project = params['project'] ?? projects[0] ?? '';
  const otherProjects = projects.filter((savedProject) => savedProject !== project);
  const qp = projectHref('', params);
  if (project === '') {
    return (
      <AppShell active="workspace" context={params}>
        <h1>Dashboard</h1>
        <div className="empty">No projects in this workspace yet. <a href="/new">Capture your first intent</a></div>
      </AppShell>
    );
  }
  const views = getViews(root, project);
  const intents = Object.values(views.intents).sort((a, b) => (a.feature_id < b.feature_id ? -1 : 1));
  const findings = Object.values(views.findings);
  const runs = listRuns(root).filter((r) => r.project === project);
  const latestRunIds = new Set(intents.map((i) => runs.find((r) => r.intent === i.id)?.id));
  const stageOf = (intentId: string, state: string): Stage => {
    if (state !== 'approved') return 'draft';
    const latestRun = runs.find((r) => r.intent === intentId);
    const mine = findings.filter((f) => f.requirement_version_id === intentId && !f.stale && f.run_id === latestRun?.id);
    if (mine.length === 0) return 'awaiting-check';
    const expected = views.intents[intentId]?.criteria.length ?? 0;
    return mine.length < expected || mine.some((f) => f.finding !== 'supported') ? 'attention' : 'established';
  };
  const order: Record<Stage, number> = { attention: 0, draft: 1, 'awaiting-check': 2, established: 3 };
  const flow = intents
    .map((i) => ({ intent: i, stage: stageOf(i.id, i.state) }))
    .sort((a, b) => order[a.stage] - order[b.stage]);
  const queue = findings
    .filter((f) => f.finding !== 'supported' && !f.stale && latestRunIds.has(f.run_id))
    .slice(0, 8)
    .map((f) => {
      const intent = views.intents[f.requirement_version_id];
      const criterion = intent?.criteria.find((c) => c.id === f.criterion_id);
      return { finding: f, feature: intent?.feature_id ?? 'unknown feature', text: criterion?.text ?? f.criterion_id };
    });
  const nextHref =
    flow.length === 0
      ? `/new${qp}`
      : flow[0]!.stage === 'draft'
        ? `/intent/${encodeURIComponent(flow[0]!.intent.id)}${qp}`
        : flow[0]!.stage === 'awaiting-check'
          ? `/intent/${encodeURIComponent(flow[0]!.intent.id)}${qp}`
          : flow[0]!.stage === 'attention' && runs.some((r) => r.intent === flow[0]!.intent.id)
            ? `/run/${encodeURIComponent(runs.find((r) => r.intent === flow[0]!.intent.id)!.id)}${qp}`
            : `/new${qp}`;
  const nextLabel =
    flow.length === 0
      ? 'Capture your first intent'
      : flow[0]!.stage === 'draft'
        ? `Review the draft: ${flow[0]!.intent.feature_id}`
        : flow[0]!.stage === 'awaiting-check'
          ? `Verify ${flow[0]!.intent.feature_id} against the repository`
          : flow[0]!.stage === 'attention'
            ? 'Inspect the finding that needs attention'
            : 'Capture the next intent';
  const checked = findings.filter((f) => !f.stale && latestRunIds.has(f.run_id));
  const checkedProviders = new Set(runs.filter((r) => latestRunIds.has(r.id)).map((r) => r.provider.split('/')[0] ?? 'rules'));
  const providerNote = checkedProviders.has('meta')
    ? checkedProviders.size > 1
      ? 'Rules-based and Meta model checks'
      : 'Meta model checks'
    : 'Rules-based checks · no model assessment';
  const nSupported = checked.filter((f) => f.finding === 'supported').length;
  const nAttention = checked.filter((f) => f.finding === 'partial' || f.finding === 'contradicted').length;
  const nContradicted = checked.filter((f) => f.finding === 'contradicted').length;
  const nUnproven = checked.length - nSupported - nAttention;
  const pct = (n: number) => (checked.length === 0 ? 0 : (n / checked.length) * 100);
  return (
    <AppShell active="workspace" context={params}>
      <div className="casehead">
        <p className="eyebrow">Your project</p>
        <h1>{projectName(project)}</h1>
        <p className="lede">
          {intents.length} intention{intents.length === 1 ? '' : 's'} · {runs.length} verification run{runs.length === 1 ? '' : 's'} ·{' '}
          <a href={projectHref('/new', params)}>New intent</a>
        </p>
        {checked.length === 0 ? (
          <p className="muted">Nothing checked yet — no verdict bar to draw. Approve an intent and verify it to start the thread of proof.</p>
        ) : (
          <>
            <div className="verdictbar" role="img" aria-label={`${nSupported} of ${checked.length} checked criteria established, ${nAttention} need attention, ${nUnproven} unproven`}>
              <span className="vb-supported" style={{ width: `${pct(nSupported)}%` }} />
              <span className="vb-attention" style={{ width: `${pct(nAttention - nContradicted)}%` }} />
              <span className="vb-contradicted" style={{ width: `${pct(nContradicted)}%` }} />
              <span className="vb-unproven" style={{ width: `${pct(nUnproven)}%` }} />
            </div>
            <p className="verdictbar-legend">
              <span><strong>{nSupported} of {checked.length}</strong> checked criteria established</span>
              <span>{nAttention} need attention ({nContradicted} contradicted)</span>
              <span>{nUnproven} unproven</span>
              <span>{providerNote}</span>
            </p>
          </>
        )}
        <ol className="steps">
        <li className={params['repo'] ? 'done' : undefined}>1 · Connect repository</li>
          <li className={intents.length > 0 ? 'done' : 'now'}>2 · Describe what to build</li>
          <li className={intents.some((i) => i.state === 'approved') ? 'done' : intents.length > 0 ? 'now' : undefined}>3 · Approve requirements</li>
          <li className={runs.length > 0 ? 'done' : intents.some((i) => i.state === 'approved') ? 'now' : undefined}>4 · Verify implementation</li>
          <li>5 · Fix and recheck</li>
        </ol>
      </div>
      {otherProjects.length > 0 ? (
        <details className="saved-projects">
          <summary>Other saved projects ({otherProjects.length})</summary>
          <ul>
            {otherProjects.map((p) => (
              <li key={p}><a href={`/workspace?project=${encodeURIComponent(p)}`}>{projectName(p)}</a></li>
            ))}
          </ul>
        </details>
      ) : null}

      <div className="card next-action">
        <p className="stat-label">Next action</p>
        <p className="next-link"><a href={nextHref}>{nextLabel}</a></p>
      </div>

      <h2>Your feature briefs</h2>
      {flow.length === 0 ? (
        <div className="empty">Nothing captured yet. Describe what your coding agent is supposed to build.</div>
      ) : (
        ([
          { title: 'Needs your attention', stages: ['attention' as Stage] },
          { title: 'In review', stages: ['draft' as Stage, 'awaiting-check' as Stage] },
          { title: 'Established', stages: ['established' as Stage] },
        ]).map((group) => {
          const items = flow.filter(({ stage }) => group.stages.includes(stage));
          if (items.length === 0) return null;
          return (
            <section key={group.title}>
              <h3 className="group-h">{group.title} ({items.length})</h3>
              <ol className="flow">
                {items.map(({ intent, stage }) => (
                  <li key={intent.id} className={`flow-item ${stage}`}>
                    <a href={`/intent/${encodeURIComponent(intent.id)}${qp}`}>{intent.feature_id}</a>
                    <span className={`badge ${stage === 'established' ? 'supported' : stage === 'attention' ? 'contradicted' : stage === 'draft' ? 'medium' : ''}`}>
                      {STAGE_LABEL[stage]}
                    </span>
                    <span className="evidence">v{intent.version} · {intent.criteria.length} criteria</span>
                  </li>
                ))}
              </ol>
            </section>
          );
        })
      )}

      <h2>Needs attention</h2>
      {queue.length === 0 ? (
        <div className="empty">Nothing open — every checked criterion is established or nothing has been checked yet.</div>
      ) : (
        <ul className="queue">
          {queue.map(({ finding, feature, text }) => (
            <li key={finding.id}>
              <span className={`badge ${finding.finding}`}>{finding.finding}</span>{' '}
              <a href={`/run/${encodeURIComponent(finding.run_id)}${qp}`}>{text}</a>
              <span className="evidence"> — {feature} · grade {finding.evidence_grade}</span>
            </li>
          ))}
        </ul>
      )}

      <h2>Recent runs</h2>
      {runs.length === 0 ? (
        <div className="empty">No runs yet — approve an intent, then verify it against your repository.</div>
      ) : (
        <ol className="timeline">
          {runs.slice(0, 5).map((r) => (
            <li key={r.id}>
              <a href={`/run/${encodeURIComponent(r.id)}${r.project !== '' ? `?project=${encodeURIComponent(r.project)}` : ''}`}>
                <code>{r.revision.slice(0, 7)}</code> — {r.summary}
              </a>
              <span className="evidence"> · {r.provider} · {r.created}</span>
            </li>
          ))}
        </ol>
      )}
    </AppShell>
  );
}
