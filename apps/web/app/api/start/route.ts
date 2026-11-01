import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { appendEvent, openProjectStore } from '@buildbrief/store';
import { ideaDraft, type IdeaInput } from '../../../lib/idea';
import { workspaceRoot } from '../../../lib/ledger';

export async function POST(request: Request) {
  const form = await request.formData();
  const input: IdeaInput = { project: String(form.get('project') ?? '').trim(), idea: String(form.get('idea') ?? '').trim(), audience: String(form.get('audience') ?? '').trim(), behaviors: String(form.get('behaviors') ?? '').trim(), boundaries: String(form.get('boundaries') ?? '').trim(), questions: String(form.get('questions') ?? '').trim() };
  let intentId = '';
  let error = '';
  try {
    const draft = ideaDraft(input);
    const store = openProjectStore(workspaceRoot(), input.project);
    appendEvent(store, 'prompt.captured', input.project, { prompt: draft.exact_source_text, source_hash: draft.source_hash, source: 'idea_form' });
    appendEvent(store, 'intent.extracted', input.project, { intent: draft });
    intentId = draft.id;
    (await cookies()).set('bb-project', input.project, { httpOnly: true, sameSite: 'strict', path: '/', maxAge: 60 * 60 * 24 * 30 });
  } catch (e) { error = (e as Error).message; }
  if (error) redirect(`/start?${new URLSearchParams({ project: input.project, error })}`);
  redirect(`/intent/${encodeURIComponent(intentId)}?${new URLSearchParams({ project: input.project })}`);
}
