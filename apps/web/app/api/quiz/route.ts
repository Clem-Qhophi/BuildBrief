import { redirect } from 'next/navigation';
import { readFileSync } from 'node:fs';
import { collectManifest, headSha, safeJoin } from '@buildbrief/repo';
import { makeQuiz, retireStale } from '@buildbrief/learning';
import type { QuizItem } from '@buildbrief/domain';
import { readView, writeView } from '@buildbrief/store';
import { getViewsForWrite } from '../store';
import { allReportEvidence, readReportFile, workspaceRoot } from '../../../lib/ledger';

/** Generate quiz questions from a run's verified findings; retire moved ones. */
export async function POST(request: Request): Promise<Response> {
  const form = await request.formData();
  const project = String(form.get('project') ?? '');
  const intentId = String(form.get('intent') ?? '');
  const runId = String(form.get('run') ?? '');
  const repo = String(form.get('repo') ?? '').trim();
  const typesRaw = String(form.get('types') ?? 'locate,predict');
  if (project === '' || intentId === '' || runId === '') {
    return new Response('project, intent, and run are required', { status: 400 });
  }
  const root = workspaceRoot();
  const views = getViewsForWrite(root, project);
  const intent = views.intents[intentId];
  if (intent === undefined) return new Response('unknown intent', { status: 404 });
  const report = readReportFile(root, runId) as Parameters<typeof makeQuiz>[0]['report'] | null;
  if (report === null) return new Response('unknown run', { status: 404 });
  const types = typesRaw.split(',').map((t) => t.trim()).filter((t) => t === 'locate' || t === 'predict' || t === 'explain_back') as ('locate' | 'predict' | 'explain_back')[];
  const fresh = makeQuiz({
    projectId: project,
    intent,
    report,
    ...(types.length > 0 ? { types } : {}),
  });
  const stored = readView<QuizItem[]>(views.store, 'quizzes', []);
  const known = new Set(stored.map((q) => q.id));
  const merged = [...stored, ...fresh.filter((q) => !known.has(q.id))];
  let finalList = merged;
  if (repo !== '') {
    try {
      const manifest = collectManifest(repo, null);
      const current = new Map<string, string>();
      for (const f of manifest.files) {
        try {
          current.set(f.path, readFileSync(safeJoin(repo, f.path), 'utf8'));
        } catch {
          continue;
        }
      }
      finalList = retireStale(merged, headSha(repo) ?? report.checked_revision, current, allReportEvidence(root));
    } catch {
      // Repo unreadable: keep unretired list rather than failing the quiz.
    }
  }
  writeView(views.store, 'quizzes', finalList);
  redirect(`/run/${encodeURIComponent(runId)}?view=technical&project=${encodeURIComponent(project)}${repo !== '' ? `&repo=${encodeURIComponent(repo)}` : ''}#quiz`);
}
