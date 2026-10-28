import { createHash } from 'node:crypto';
import { existsSync, lstatSync, readFileSync, readdirSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';

/** Hard excludes always applied, before any ignore file. */
const ALWAYS_EXCLUDE_DIRS = new Set(['.git', 'node_modules', 'dist', '.buildbrief', '__pycache__', '.venv', 'coverage']);
/** Secret-adjacent files are never evidence, with or without an ignore file. */
const ALWAYS_EXCLUDE_FILES = [/^\.env(\.|$)/, /\.pem$/, /\.key$/];
const BINARY_EXT = new Set(['.png', '.jpg', '.jpeg', '.gif', '.mp4', '.zip', '.exe', '.dll', '.pdf', '.ico', '.woff2']);
export const MAX_FILE_BYTES = 256 * 1024;

export interface FileEntry {
  path: string;
  bytes: number;
  sha256: string;
  lines: number;
}

export interface Manifest {
  root: string;
  revision: string | null;
  files: FileEntry[];
  skipped: { path: string; reason: string }[];
}

/** Minimal ignore matcher: blank lines + `#` comments; `dir/` prefixes; `*.ext`/exact globs. */
export function loadIgnoreFile(root: string, name: string): string[] {
  const p = join(root, name);
  if (!existsSync(p)) return [];
  return readFileSync(p, 'utf8')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith('#'));
}

function patternToTest(pattern: string): (rel: string) => boolean {
  if (pattern.endsWith('/')) {
    const dir = pattern.slice(0, -1);
    return (rel) => rel === dir || rel.startsWith(`${dir}/`);
  }
  if (pattern.includes('*')) {
    const rx = new RegExp(`^${pattern.split('*').map(escapeRx).join('.*')}$`);
    return (rel) => rx.test(rel) || rx.test(rel.split('/').pop() ?? rel);
  }
  return (rel) => rel === pattern || rel.endsWith(`/${pattern}`);
}

function escapeRx(s: string): string {
  return s.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
}

/** Resolves `target` against root; throws when it escapes the root (traversal defense). */
export function safeJoin(root: string, target: string): string {
  const base = resolve(root);
  const abs = resolve(base, target);
  const rel = relative(base, abs);
  if (rel === '' || rel === '..' || rel.startsWith(`..${sep}`)) {
    throw new Error(`path escapes repository root: ${target}`);
  }
  return abs;
}

export function collectManifest(root: string, revision: string | null, extraIgnores: string[] = []): Manifest {
  const ignorePatterns = [...loadIgnoreFile(root, '.buildbriefignore'), ...extraIgnores];
  const tests = ignorePatterns.map(patternToTest);
  const files: FileEntry[] = [];
  const skipped: { path: string; reason: string }[] = [];
  const isIgnored = (rel: string): boolean => tests.some((t) => t(rel));

  const walk = (dir: string): void => {
    let entries: string[];
    try {
      entries = readdirSync(dir);
    } catch {
      return;
    }
    for (const name of entries) {
      const abs = join(dir, name);
      const rel = relative(root, abs).split(sep).join('/');
      let st;
      try {
        st = lstatSync(abs);
      } catch {
        skipped.push({ path: rel, reason: 'unreadable' });
        continue;
      }
      if (st.isSymbolicLink()) {
        skipped.push({ path: rel, reason: 'symlink_excluded' });
        continue;
      }
      if (st.isDirectory()) {
        if (ALWAYS_EXCLUDE_DIRS.has(name) || isIgnored(`${rel}/`) || isIgnored(rel)) {
          skipped.push({ path: rel, reason: 'excluded' });
          continue;
        }
        walk(abs);
        continue;
      }
      if (!st.isFile()) {
        skipped.push({ path: rel, reason: 'not_regular_file' });
        continue;
      }
      if (ALWAYS_EXCLUDE_FILES.some((rx) => rx.test(name))) {
        skipped.push({ path: rel, reason: 'secret_adjacent_excluded' });
        continue;
      }
      if (isIgnored(rel)) {
        skipped.push({ path: rel, reason: 'ignored' });
        continue;
      }
      const ext = rel.includes('.') ? rel.slice(rel.lastIndexOf('.')).toLowerCase() : '';
      if (BINARY_EXT.has(ext)) {
        skipped.push({ path: rel, reason: 'binary_excluded' });
        continue;
      }
      if (st.size > MAX_FILE_BYTES) {
        skipped.push({ path: rel, reason: 'too_large' });
        continue;
      }
      let text: string;
      try {
        const buf = readFileSync(abs);
        if (buf.includes(0)) {
          skipped.push({ path: rel, reason: 'binary_excluded' });
          continue;
        }
        text = buf.toString('utf8');
      } catch {
        skipped.push({ path: rel, reason: 'unreadable' });
        continue;
      }
      files.push({
        path: rel,
        bytes: st.size,
        sha256: createHash('sha256').update(text, 'utf8').digest('hex'),
        lines: text.length === 0 ? 0 : text.split('\n').length,
      });
    }
  };
  walk(root);
  files.sort((a, b) => (a.path < b.path ? -1 : 1));
  return { root, revision, files, skipped };
}

const SECRET_PATTERNS: { name: string; rx: RegExp }[] = [
  { name: 'meta_api_key', rx: /LLM_\d+_[A-Za-z0-9_]+/ },
  { name: 'aws_key', rx: /AKIA[0-9A-Z]{16}/ },
  { name: 'private_key_block', rx: /-----BEGIN [A-Z ]*PRIVATE KEY-----/ },
  { name: 'generic_secret_assign', rx: /(api[_-]?key|secret|passwd|password)\s*[:=]\s*['"][^'"]{8,}['"]/i },
];

/** Scans manifest-listed files for secret-shaped strings. Returns flagged relative paths. */
export function scanSecrets(root: string, manifest: Manifest): { path: string; kind: string }[] {
  const hits: { path: string; kind: string }[] = [];
  for (const f of manifest.files) {
    let text: string;
    try {
      text = readFileSync(safeJoin(root, f.path), 'utf8');
    } catch {
      continue;
    }
    for (const p of SECRET_PATTERNS) {
      if (p.rx.test(text)) {
        hits.push({ path: f.path, kind: p.name });
        break;
      }
    }
  }
  return hits;
}
