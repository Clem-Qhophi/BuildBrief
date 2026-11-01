import { redirect } from 'next/navigation';
import { appendEvent } from '@buildbrief/store';
import type { VerificationFinding } from '@buildbrief/domain';
import { getViewsForWrite } from '../store';
import { workspaceRoot } from '../../../lib/ledger';
import { doVerify, type WebProvider } from '../../../lib/actions';

/** Re-verify: fresh verdicts at the current revision, old findings go stale. */
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
  const oldIds = Object.values(views.findings)
    .filter((f: VerificationFinding) => f.requirement_version_id === intentId)
    .map((f: VerificationFinding) => f.id);
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
    redirect(`/intent/${encodeURIComponent(intentId)}?${new URLSearchParams({ project, repo, error: (e as Error).message })}`);
  }
  const after = getViewsForWrite(root, project);
  const freshIds = Object.values(after.findings)
    .filter((f: VerificationFinding) => f.requirement_version_id === intentId && !oldIds.includes(f.id))
    .map((f: VerificationFinding) => f.id);
  if (oldIds.length > 0) {
    appendEvent(after.store, 'evidence.invalidated', project, { finding_ids: oldIds, superseded_by_findings: freshIds });
    appendEvent(after.store, 'recheck.completed', project, { intent_id: intentId, invalidated: oldIds.length, fresh: freshIds.length });
  }
  redirect(`/run/${encodeURIComponent(runId)}?view=technical&project=${encodeURIComponent(project)}&repo=${encodeURIComponent(repo)}`);
}
