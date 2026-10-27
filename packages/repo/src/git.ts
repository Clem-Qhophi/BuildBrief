import { execFileSync } from 'node:child_process';

export class GitError extends Error {
  constructor(
    message: string,
    readonly command: string[],
    readonly stderr: string,
  ) {
    super(message);
    this.name = 'GitError';
  }
}

function git(cwd: string, args: string[]): string {
  try {
    return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (e) {
    const err = e as { stderr?: Buffer | string; message?: string };
    const stderr = typeof err.stderr === 'string' ? err.stderr : (err.stderr?.toString() ?? err.message ?? 'git failed');
    throw new GitError(`git ${args.join(' ')} failed: ${stderr.slice(0, 300)}`, args, stderr);
  }
}

export function isGitRepo(cwd: string): boolean {
  try {
    git(cwd, ['rev-parse', '--git-dir']);
    return true;
  } catch {
    return false;
  }
}

/** Full HEAD SHA, or null when no commits exist yet. */
export function headSha(cwd: string): string | null {
  try {
    return git(cwd, ['rev-parse', 'HEAD']).trim();
  } catch {
    return null;
  }
}

/** Unified diff with rename detection between two revisions (or worktree when to is null). */
export function diffText(cwd: string, from: string, to: string | null): string {
  const args = to === null
    ? ['diff', '--find-renames', `${from}`]
    : ['diff', '--find-renames', `${from}`, `${to}`];
  try {
    return git(cwd, args);
  } catch (e) {
    if (e instanceof GitError && e.stderr.includes('unknown revision')) throw e;
    return '';
  }
}

export interface Hunk {
  path: string;
  oldPath?: string;
  newPath?: string;
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  kind: 'add' | 'delete' | 'modify' | 'rename';
  body: string;
  hash: string;
}

const DIFF_GIT = /^diff --git a\/(.+?) b\/(.+)$/;
const HUNK_HEAD = /^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/;

export function parseHunks(diff: string, hash: (s: string) => string): Hunk[] {
  const hunks: Hunk[] = [];
  let path = '';
  let oldPath: string | undefined;
  let kind: Hunk['kind'] = 'modify';
  let cur: Omit<Hunk, 'hash'> | null = null;
  const flush = (): void => {
    if (cur !== null) {
      hunks.push({ ...cur, hash: hash(`${cur.path}\n${cur.body}`) });
      cur = null;
    }
  };
  for (const line of diff.split('\n')) {
    const dg = DIFF_GIT.exec(line);
    if (dg !== null) {
      flush();
      oldPath = dg[1];
      path = dg[2] as string;
      kind = 'modify';
      continue;
    }
    if (line.startsWith('new file mode')) { kind = 'add'; continue; }
    if (line.startsWith('deleted file mode')) { kind = 'delete'; continue; }
    if (line.startsWith('similarity index') || line.startsWith('rename from') || line.startsWith('rename to')) {
      kind = 'rename';
      continue;
    }
    const hh = HUNK_HEAD.exec(line);
    if (hh !== null) {
      flush();
      cur = {
        path,
        oldStart: Number(hh[1]),
        oldLines: hh[2] === undefined ? 1 : Number(hh[2]),
        newStart: Number(hh[3]),
        newLines: hh[4] === undefined ? 1 : Number(hh[4]),
        kind,
        body: '',
        ...(oldPath !== undefined && oldPath !== path ? { oldPath, newPath: path } : {}),
      };
      continue;
    }
    if (cur !== null && (line.startsWith('+') || line.startsWith('-') || line.startsWith(' '))) {
      cur.body += `${line}\n`;
    }
  }
  flush();
  return hunks;
}
