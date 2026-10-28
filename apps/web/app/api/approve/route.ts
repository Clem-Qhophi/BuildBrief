import { redirect } from 'next/navigation';
import { approveIntent } from '@buildbrief/domain';
import { appendEvent, rebuildViews } from '@buildbrief/store';
import { getViewsForWrite } from '../store';
import { workspaceRoot } from '../../../lib/ledger';

export async function POST(request: Request): Promise<Response> {
  const form = await request.formData();
  const project = String(form.get('project') ?? '');
  const intentId = String(form.get('intent') ?? '');
  const actor = String(form.get('actor') ?? '').trim();
  const repo = String(form.get('repo') ?? '').trim();
  if (project === '' || intentId === '' || actor === '') {
    return new Response('project, intent, and actor are required', { status: 400 });
  }
  const root = workspaceRoot();
  const views = getViewsForWrite(root, project);
  const current = views.intents[intentId];
  if (current === undefined) return new Response('unknown intent', { status: 404 });
  const result = approveIntent({ intent: current, actor });
  if (!result.ok) return new Response(`cannot approve: ${result.error.message}`, { status: 400 });
  appendEvent(views.store, 'intent.approved', project, { intent: result.intent, actor });
  rebuildViews(views.store, project);
  redirect(`/intent/${encodeURIComponent(intentId)}?project=${encodeURIComponent(project)}${repo !== '' ? `&repo=${encodeURIComponent(repo)}` : ''}`);
}
