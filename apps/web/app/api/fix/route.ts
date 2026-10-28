import { redirect } from 'next/navigation';
import { packsForFailures } from '@buildbrief/verifier';
import { appendEvent } from '@buildbrief/store';
import { getViewsForWrite } from '../store';
import { readReportFile, workspaceRoot } from '../../../lib/ledger';

/**
 * Build bounded correction packs for a run's failures and store them.
 * A pack is guidance, never a resolution — verdicts change only on recheck.
 */
export async function POST(request: Request): Promise<Response> {
  const form = await request.formData();
  const project = String(form.get('project') ?? '');
  const runId = String(form.get('run') ?? '');
  const repo = String(form.get('repo') ?? '').trim();
  if (project === '' || runId === '') {
    return new Response('project and run are required', { status: 400 });
  }
  const root = workspaceRoot();
  const report = readReportFile(root, runId) as {
    requirement_version_id: string;
    results: Parameters<typeof packsForFailures>[0]['results'];
    created_at: string;
  } | null;
  if (report === null) return new Response('unknown run', { status: 404 });
  const views = getViewsForWrite(root, project);
  const intent = views.intents[report.requirement_version_id];
  if (intent === undefined) return new Response('intent for report not found in ledger', { status: 404 });
  const packs = packsForFailures({
    id: `pack-${runId}`,
    projectId: project,
    intent,
    results: report.results,
    at: new Date().toISOString(),
  });
  for (const p of packs) appendEvent(views.store, 'correction.pack_created', project, { pack: p });
  redirect(`/run/${encodeURIComponent(runId)}?project=${encodeURIComponent(project)}${repo !== '' ? `&repo=${encodeURIComponent(repo)}` : ''}#packs`);
}
