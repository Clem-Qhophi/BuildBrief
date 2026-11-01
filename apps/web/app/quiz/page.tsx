import AppShell from '../components/AppShell';
import { projectParams } from '../../lib/context';
import { comprehensionMap } from '@buildbrief/learning';
import { latestRevision } from '@buildbrief/store';
import { getViews, listQuizzes, listResponses, listRuns, workspaceRoot } from '../../lib/ledger';
import { aggregateCells, quizTypeCounts } from '../../lib/study';

export const dynamic = 'force-dynamic';

const TYPE_BLURBS: Record<string, string> = {
  locate: 'Find it in the code. Graded automatically against the cited file and lines.',
  predict: 'Say what the product will do. A human grades it against the rubric.',
  explain_back: 'Explain it in your own words. A human grades it against the rubric.',
};

export default function QuizPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  return QuizAsync({ searchParams });
}

async function QuizAsync({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await projectParams(await searchParams);
  const root = workspaceRoot();
  const project = params['project'] ?? '';
  const repoDefault = params['repo'] ?? '';
  if (project === '') {
    return (
      <AppShell active="quiz" context={params}>
        <h1>Test yourself</h1>
        <p className="lede">Grounded questions about your own features. Nothing to quiz yet.</p>
        <div className="empty">No project selected. <a href="/connect">Connect your project</a>, <a href="/start">start with an idea</a>, or <a href="/demo">run the working example</a>.</div>
      </AppShell>
    );
  }
  const views = getViews(root, project);
  const intents = Object.values(views.intents).sort((a, b) => (a.feature_id < b.feature_id ? -1 : 1));
  const runs = listRuns(root).filter((r) => r.project === project);
  const quizzes = listQuizzes(root).filter((q) => q.project_id === project);
  const live = quizzes.filter((q) => q.status !== 'retired');
  const liveIds = new Set(live.map((q) => q.id));
  const responses = listResponses(root).filter((r) => liveIds.has(r.quiz_id));
  let answeredPass = 0;
  let answeredFail = 0;
  let answeredPending = 0;
  for (const r of responses) {
    if (r.graded === 'pass') answeredPass += 1;
    else if (r.graded === 'fail') answeredFail += 1;
    else answeredPending += 1;
  }
  const types = quizTypeCounts(quizzes, project);
  const withChecks = intents.filter((i) => runs.some((r) => r.intent === i.id)).length;

  const perIntent = intents.map((intent) => {
    const intentFindings = Object.values(views.findings).filter((f) => f.requirement_version_id === intent.id);
    const findings = new Map<string, string>();
    for (const f of intentFindings) {
      findings.set(f.criterion_id, `${f.finding}${f.stale ? ' (stale)' : ''}`);
    }
    const cells = comprehensionMap({
      criteria: intent.criteria.map((c) => ({ id: c.id, text: c.text })),
      findings,
      quizzes: quizzes as never,
      responses: responses as never,
      currentRevision: latestRevision(intentFindings),
    });
    return { intent, run: runs.find((r) => r.intent === intent.id), summary: aggregateCells(cells) };
  });

  const answeredQuizIds = new Set(responses.map((r) => r.quiz_id));
  const unanswered = live.filter((q) => !answeredQuizIds.has(q.id)).slice(0, 10);
  const intentOfQuiz = (quiz: { criterion_ids: string[] }) =>
    intents.find((i) => i.criteria.some((c) => quiz.criterion_ids.includes(c.id)));

  return (
    <AppShell active="quiz" context={params}>
      <h1>Test yourself</h1>
      <p className="lede">Questions grounded in your own checked features. Open answers wait for a human grade; nothing here is a guessed score.</p>

      <h2>Summary</h2>
      {intents.length === 0 ? (
        <div className="empty">No features yet. <a href="/connect">Connect your project</a> and capture a brief, or <a href="/demo">run the working example</a>.</div>
      ) : (
        <p className="muted">{withChecks} of {intents.length} features checked · {types.locate + types.predict + types.explain_back + types.other} live questions · {answeredPass} passing, {answeredFail} failing, {answeredPending} awaiting grade</p>
      )}

      <h2>By feature</h2>
      {intents.length === 0 ? (
        <div className="empty">Capture a brief first, then verify it to unlock questions.</div>
      ) : (
        <div className="grid cols-2">{perIntent.map(({ intent, run, summary }) => {
          const query = new URLSearchParams({ project, intent: intent.id, repo: repoDefault });
          return <section key={intent.id} className="card"><h3>{intent.feature_id}</h3>
            <p className="muted">{summary.demonstrated} demonstrated · {summary.struggling} struggling · {summary.other} unmeasured or stale · {run ? `latest check ${run.revision.slice(0, 7)}` : 'not verified yet'}</p>
            {run ? <>
              <form method="POST" action="/api/quiz">
                <input type="hidden" name="project" value={project} />
                <input type="hidden" name="intent" value={intent.id} />
                <input type="hidden" name="run" value={run.id} />
                {repoDefault !== '' ? <input type="hidden" name="repo" value={repoDefault} /> : null}
                <button type="submit">Generate &amp; take the quiz</button>
              </form>
              <p><a href={`/map?${query}`}>Open comprehension map</a> · <a href={`/run/${encodeURIComponent(run.id)}?${query}#understand`}>Answer in the run report</a></p>
            </> : <p><a href={`/intent/${encodeURIComponent(intent.id)}?${query}`}>Verify this brief first</a> to unlock questions grounded in evidence.</p>}
          </section>;
        })}</div>
      )}

      <h2>By category</h2>
      <ul>
        {(['locate', 'predict', 'explain_back'] as const).map((t) => (
          <li key={t}><strong>{t}</strong> — {types[t]} live questions. {TYPE_BLURBS[t]}</li>
        ))}
      </ul>

      <h2>General mixed</h2>
      {unanswered.length === 0 ? (
        <div className="empty">No unanswered questions right now. Generate a quiz above, or verify a brief to create grounded questions.</div>
      ) : (
        <ol>{unanswered.map((q) => {
          const owner = intentOfQuiz(q);
          const ownerRun = owner ? runs.find((r) => r.intent === owner.id) : undefined;
          const target = ownerRun
            ? `/run/${encodeURIComponent(ownerRun.id)}?project=${encodeURIComponent(project)}${repoDefault !== '' ? `&repo=${encodeURIComponent(repoDefault)}` : ''}#understand`
            : owner ? `/intent/${encodeURIComponent(owner.id)}?project=${encodeURIComponent(project)}` : `/workspace?project=${encodeURIComponent(project)}`;
          return <li key={q.id}><a href={target}>{q.prompt}</a> <span className="evidence">{q.type} · {owner?.feature_id ?? 'no linked feature'}</span></li>;
        })}</ol>
      )}
    </AppShell>
  );
}
