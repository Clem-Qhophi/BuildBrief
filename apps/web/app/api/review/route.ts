import { makeReviewDecision, type ReviewOutcome } from '@buildbrief/domain';
import { appendEvent, openProjectStore } from '@buildbrief/store';
import { redirect } from 'next/navigation';
import { readReportFile, workspaceRoot } from '../../../lib/ledger';

export async function POST(request: Request) {
  const form = await request.formData();
  const run = String(form.get('run') ?? '');
  const root = workspaceRoot();
  const report = readReportFile(root, run) as { project_id: string; checked_revision: string; requirement_version_id: string } | null;
  if (!report) return new Response('Choose an existing report before recording a review.', { status: 404 });
  let error = '';
  try {
    const decision = makeReviewDecision({
      project_id: report.project_id, run_id: run, revision: report.checked_revision,
      requirement_version_id: report.requirement_version_id, outcome: String(form.get('outcome') ?? '') as ReviewOutcome,
      actor: String(form.get('actor') ?? ''), note: String(form.get('note') ?? ''), at: new Date().toISOString(),
    });
    appendEvent(openProjectStore(root, report.project_id), 'review.decision_recorded', report.project_id, { decision });
  } catch (e) { error = (e as Error).message; }
  redirect(`/run/${encodeURIComponent(run)}?${new URLSearchParams({ project: report.project_id, ...(error ? { review_error: error } : { reviewed: '1' }) })}#review-decision`);
}
