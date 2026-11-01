import { redirect } from 'next/navigation';
import { probeResetExample } from '../../../../lib/reset-example';
import { workspaceRoot } from '../../../../lib/ledger';

export async function POST(request: Request) {
  const form = await request.formData();
  const project = String(form.get('project') ?? '');
  const version = form.get('version') === 'after' ? 'after' : 'before';
  const age = Number(form.get('age') ?? 31);
  const used = form.get('used') === 'yes';
  let error = '';
  try { probeResetExample(workspaceRoot(), project, version, age, used); }
  catch (e) { error = (e as Error).message; }
  if (form.get('return') === 'home') redirect(`/?${new URLSearchParams({ example: project, build: version, ...(error ? { error } : {}) })}#product-map`);
  const demoTarget = `/demo?${new URLSearchParams({ project, scenario: 'reset', ...(error ? { error } : {}) })}`;
  // #try-example only exists when the example loaded, so omit it on the error path.
  redirect(error ? demoTarget : `${demoTarget}#try-example`);
}
