import { cookies } from 'next/headers';
import { listProjects, workspaceRoot } from './ledger';
import { readConnections, resolveContext } from './connections';

export async function projectParams(params: Record<string, string | undefined> = {}) {
  const selected = (await cookies()).get('bb-project')?.value ?? listProjects(workspaceRoot())[0] ?? '';
  return resolveContext(readConnections(workspaceRoot()), params, selected);
}

export function projectHref(path: string, params: Record<string, string | undefined>): string {
  const query = new URLSearchParams();
  for (const name of ['project', 'repo']) { const value = params[name]; if (value) query.set(name, value); }
  return `${path}${query.size > 0 ? `?${query}` : ''}`;
}
