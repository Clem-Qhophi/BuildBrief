import { redirect } from 'next/navigation';
import { appendEvent, rebuildViews } from '@buildbrief/store';
import { getViewsForWrite } from '../store';
import { workspaceRoot } from '../../../lib/ledger';

const ALLOWED = new Set(['explained', 'linked', 'approved', 'rejected']);

export async function POST(request: Request): Promise<Response> {
  const form = await request.formData();
  const project = String(form.get('project') ?? '');
  const orphan = String(form.get('orphan') ?? '');
  const disposition = String(form.get('disposition') ?? '');
  const by = String(form.get('by') ?? '').trim();
  if (project === '' || orphan === '' || !ALLOWED.has(disposition) || by === '') {
    return new Response('project, orphan, valid disposition, and grader name are required', { status: 400 });
  }
  const root = workspaceRoot();
  const views = getViewsForWrite(root, project);
  if (views.orphans[orphan] === undefined) return new Response('unknown orphan change', { status: 404 });
  appendEvent(views.store, 'change.dispositioned', project, { orphan_id: orphan, disposition, by });
  rebuildViews(views.store, project);
  redirect(`/changes?project=${encodeURIComponent(project)}`);
}
