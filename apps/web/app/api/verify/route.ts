import { redirect } from 'next/navigation';
import { getViewsForWrite } from '../store';
import { workspaceRoot } from '../../../lib/ledger';
import { doVerify, type WebProvider } from '../../../lib/actions';

/** Run verification for an approved intent; redirects to the run report. */
export async function POST(request: Request): Promise<Response> {
  const form = await request.formData();
  const project = String(form.get('project') ?? '');
  const intentId = String(form.get('intent') ?? '');
  const repo = String(form.get('repo') ?? '').trim();
  const base = String(form.get('base') ?? '').trim();
  const provider = String(form.get('provider') ?? 'rules');
  const accept = String(form.get('accept') ?? '').trim();
  const covers = String(form.get('covers') ?? '').split(',').map((s) => s.trim()).filter((s) => s !== '');
  if (project === '' || intentId === '' || repo === '') {
    return new Response('project, intent, and repo are required', { status: 400 });
  }
  const root = workspaceRoot();
  const views = getViewsForWrite(root, project);
  const intent = views.intents[intentId];
  if (intent === undefined) return new Response('unknown intent', { status: 404 });
  let runId: string;
  try {
    ({ run_id: runId } = await doVerify(root, {
      project,
      intent,
      repo,
      ...(base !== '' ? { base } : {}),
      provider: provider as WebProvider,
      ...(accept !== '' ? { acceptCommand: accept, acceptCovers: covers } : {}),
    }));
  } catch (e) {
    return new Response(`verify failed: ${(e as Error).message}`, { status: 400 });
  }
  redirect(`/run/${encodeURIComponent(runId)}?project=${encodeURIComponent(project)}&repo=${encodeURIComponent(repo)}`);
}
