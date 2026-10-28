import { redirect } from 'next/navigation';
import { answerQuiz } from '@buildbrief/learning';
import type { QuizItem, QuizResponse } from '@buildbrief/domain';
import { appendEvent, readView, writeView } from '@buildbrief/store';
import { getViewsForWrite } from '../store';
import { allReportEvidence, workspaceRoot } from '../../../lib/ledger';

/** Record an answer. Locate answers grade mechanically; open ones stay pending. */
export async function POST(request: Request): Promise<Response> {
  const form = await request.formData();
  const project = String(form.get('project') ?? '');
  const quizId = String(form.get('quiz') ?? '');
  const actor = String(form.get('actor') ?? '').trim();
  const text = String(form.get('text') ?? '').trim();
  const runId = String(form.get('run') ?? '');
  const repo = String(form.get('repo') ?? '').trim();
  if (project === '' || quizId === '' || actor === '' || text === '') {
    return new Response('project, quiz, actor, and text are required', { status: 400 });
  }
  const root = workspaceRoot();
  const views = getViewsForWrite(root, project);
  const quizzes = readView<QuizItem[]>(views.store, 'quizzes', []);
  const quiz = quizzes.find((q) => q.id === quizId);
  if (quiz === undefined) return new Response('unknown quiz', { status: 404 });
  const evidence = allReportEvidence(root);
  const pointers = quiz.evidence_ids
    .map((id) => evidence.get(id))
    .filter((e) => e !== undefined)
    .map((e) => ({
      id: e.id,
      ...(e.path !== undefined ? { path: e.path } : {}),
      ...(e.line_start !== undefined ? { line_start: e.line_start } : {}),
      ...(e.line_end !== undefined ? { line_end: e.line_end } : {}),
    }));
  const response = answerQuiz({ quiz, actor, text, evidence: pointers });
  const responses = readView<QuizResponse[]>(views.store, 'responses', []);
  responses.push(response);
  writeView(views.store, 'responses', responses);
  appendEvent(views.store, 'quiz.answer_submitted', project, { response });
  const back = runId !== '' ? `/run/${encodeURIComponent(runId)}?project=${encodeURIComponent(project)}${repo !== '' ? `&repo=${encodeURIComponent(repo)}` : ''}#quiz` : '/';
  redirect(back);
}
