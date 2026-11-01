import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createExample } from '../../../lib/example';
import { createResetExample } from '../../../lib/reset-example';
import { workspaceRoot } from '../../../lib/ledger';

export async function POST(request: Request) {
  const form = await request.formData();
  const scenario = form.get('scenario') === 'referral' ? 'referral' : 'reset';
  const home = form.get('return') === 'home';
  let project = '';
  let error = '';
  try {
    project = scenario === 'referral' ? await createExample(workspaceRoot()) : await createResetExample(workspaceRoot());
    (await cookies()).set('bb-project', project, { httpOnly: true, sameSite: 'strict', path: '/', maxAge: 60 * 60 * 24 * 30 });
  } catch { error = 'The example could not run. Check that Git is installed and the workspace is writable, then try again. No existing repository was changed.'; }
  if (error) redirect(`${home ? '/' : '/demo'}?error=${encodeURIComponent(error)}`);
  if (home) redirect(`/?${new URLSearchParams({ example: project })}#product-map`);
  redirect(`/demo?${new URLSearchParams({ project, scenario })}`);
}
