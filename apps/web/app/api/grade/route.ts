import { redirect } from 'next/navigation';
import { gradeResponse } from '@buildbrief/learning';
import type { QuizResponse } from '@buildbrief/domain';
import { readView, writeView } from '@buildbrief/store';
import { getViewsForWrite } from '../store';
import { workspaceRoot } from '../../../lib/ledger';

/** Human grade for an open answer. Only the owner grades; models never do. */
export async function POST(request: Request): Promise<Response> {
  const form = await request.formData();
  const project = String(form.get('project') ?? '');
  const responseId = String(form.get('response') ?? '');
  const grade = String(form.get('grade') ?? '');
  const by = String(form.get('by') ?? '').trim();
  const runId = String(form.get('run') ?? '');
  const repo = String(form.get('repo') ?? '').trim();
  if (project === '' || responseId === '' || by === '') {
    return new Response('project, response, and grader name are required', { status: 400 });
  }
  if (grade !== 'pass' && grade !== 'fail') {
    return new Response("grade must be 'pass' or 'fail'", { status: 400 });
  }
  const root = workspaceRoot();
  const views = getViewsForWrite(root, project);
  const responses = readView<QuizResponse[]>(views.store, 'responses', []);
  const idx = responses.findIndex((r) => r.id === responseId);
  if (idx === -1) return new Response('unknown response', { status: 404 });
  responses[idx] = gradeResponse(responses[idx] as QuizResponse, grade, by);
  writeView(views.store, 'responses', responses);
  const back = runId !== '' ? `/run/${encodeURIComponent(runId)}?project=${encodeURIComponent(project)}${repo !== '' ? `&repo=${encodeURIComponent(repo)}` : ''}#quiz` : '/';
  redirect(back);
}
