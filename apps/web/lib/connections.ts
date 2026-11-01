import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { isAbsolute, join } from 'node:path';

export interface Connection { project: string; repo: string; kind: 'local' | 'example'; origin?: string }

/** Local app configuration; never represents an approved requirement. */
export function readConnections(root: string): Connection[] {
  const file = join(root, '.buildbrief', 'connections.json');
  if (!existsSync(file)) return [];
  const data: unknown = JSON.parse(readFileSync(file, 'utf8'));
  if (!Array.isArray(data)) throw new Error('Invalid repository connections. Restore connections.json from a backup.');
  return data.filter((c): c is Connection => typeof c === 'object' && c !== null &&
    typeof c.project === 'string' && c.project.trim() !== '' &&
    typeof c.repo === 'string' && isAbsolute(c.repo) && (c.kind === 'local' || c.kind === 'example'));
}

export function saveConnection(root: string, connection: Connection): void {
  if (connection.project.trim() === '' || connection.project.length > 120) throw new Error('Project name is required (up to 120 characters).');
  if (!isAbsolute(connection.repo)) throw new Error('Repository directory must be an absolute local path.');
  const connections = readConnections(root).filter((c) => c.project !== connection.project);
  connections.push(connection);
  mkdirSync(join(root, '.buildbrief'), { recursive: true });
  writeFileSync(join(root, '.buildbrief', 'connections.json'), `${JSON.stringify(connections, null, 2)}\n`, 'utf8');
}

export function resolveContext(connections: Connection[], params: Record<string, string | undefined>, selected: string): Record<string, string | undefined> {
  const project = params['project'] ?? selected;
  const connection = connections.find((c) => c.project === project);
  return { ...params, project, repo: params['repo'] ?? connection?.repo ?? '' };
}

/**
 * A repository carried into a capture for `project` is only trustworthy when
 * it is that project's own saved connection, or a path no saved project owns
 * (typed fresh by the user). A path owned by a different project is the
 * previous project's context leaking into a new project's form — drop it.
 */
export function carriedRepo(connections: Connection[], project: string, repo: string): string {
  if (repo === '') return '';
  if (connections.some((c) => c.project === project && c.repo === repo)) return repo;
  if (connections.some((c) => c.repo === repo)) return '';
  return repo;
}
