import { buildHandoff } from '../../../lib/idea';
import { getViews, workspaceRoot } from '../../../lib/ledger';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const project = url.searchParams.get('project') ?? '';
  const id = url.searchParams.get('intent') ?? '';
  const intent = getViews(workspaceRoot(), project).intents[id];
  if (!intent) return new Response('This brief was not found.', { status: 404 });
  if (intent.state !== 'approved') return new Response('Approve this brief before downloading an implementation handoff.', { status: 409 });
  return new Response(buildHandoff(intent), { headers: { 'Content-Type': 'text/markdown; charset=utf-8', 'Content-Disposition': 'attachment; filename="buildbrief-approved-build.md"', 'Cache-Control': 'no-store' } });
}
