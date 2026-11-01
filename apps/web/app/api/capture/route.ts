import { redirect } from 'next/navigation';
import { extractDraft } from '@buildbrief/domain';
import { getViewsForWrite } from '../store';
import { workspaceRoot } from '../../../lib/ledger';
import { carriedRepo, readConnections } from '../../../lib/connections';
import { appendEvent } from '@buildbrief/store';

/** Capture a prompt into draft criteria. Approval stays a separate human step. */
export async function POST(request: Request): Promise<Response> {
  const form = await request.formData();
  const project = String(form.get('project') ?? '').trim();
  const feature = String(form.get('feature') ?? '').trim() || 'general';
  const prompt = String(form.get('prompt') ?? '').trim();
  const repo = String(form.get('repo') ?? '').trim();
  if (project === '') return new Response('project is required', { status: 400 });
  if (prompt === '') return new Response('prompt is required', { status: 400 });
  const root = workspaceRoot();
  const safeRepo = carriedRepo(readConnections(root), project, repo);
  const { store } = getViewsForWrite(root, project);
  const draft = extractDraft({ projectId: project, featureId: feature, prompt, completeness: 'manual' });
  appendEvent(store, 'prompt.captured', project, {
    prompt,
    source_hash: draft.source_hash,
    source: 'manual',
  });
  appendEvent(store, 'intent.extracted', project, { intent: draft });
  redirect(`/intent/${encodeURIComponent(draft.id)}?project=${encodeURIComponent(project)}${safeRepo !== '' ? `&repo=${encodeURIComponent(safeRepo)}` : ''}`);
}
