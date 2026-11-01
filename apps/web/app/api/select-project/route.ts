import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { listProjects, workspaceRoot } from '../../../lib/ledger';

export async function POST(request: Request) {
  const form = await request.formData();
  const project = String(form.get('project') ?? '');
  if (!listProjects(workspaceRoot()).includes(project)) return new Response('Unknown project. Connect it first.', { status: 400 });
  (await cookies()).set('bb-project', project, { httpOnly: true, sameSite: 'strict', path: '/', maxAge: 60 * 60 * 24 * 30 });
  redirect(`/workspace?project=${encodeURIComponent(project)}`);
}
