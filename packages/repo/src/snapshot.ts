import { readFileSync } from 'node:fs';
import { contentHash } from '@buildbrief/domain';
import { headSha } from './git.js';
import { collectManifest, safeJoin, type Manifest } from './manifest.js';

export interface Snapshot {
  revision: string;
  dirty: boolean;
  manifest: Manifest;
  /** path → { text, revision } for citation resolution. Populated lazily. */
  cache: Map<string, { text: string; revision: string }>;
}

/** Pins the working tree to HEAD. Throws when the repo has no commits yet. */
export function captureSnapshot(root: string): Snapshot {
  const revision = headSha(root);
  if (revision === null) throw new Error('cannot snapshot: repository has no commits');
  const manifest = collectManifest(root, revision);
  return { revision, dirty: false, manifest, cache: new Map() };
}

export function lookupFile(snap: Snapshot, root: string, path: string): { text: string; revision: string } | null {
  const inManifest = snap.manifest.files.some((f) => f.path === path);
  if (!inManifest) return null;
  const cached = snap.cache.get(path);
  if (cached !== undefined) return cached;
  let text: string;
  try {
    text = readFileSync(safeJoin(root, path), 'utf8');
  } catch {
    return null;
  }
  const entry = { text, revision: snap.revision };
  snap.cache.set(path, entry);
  return entry;
}

/** Line-anchored snippet hash for an evidence pointer. */
export function snippetHash(text: string, start: number, end: number): string {
  const lines = text.split('\n');
  return contentHash(lines.slice(start - 1, end).join('\n'));
}
