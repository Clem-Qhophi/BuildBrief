import { execFileSync } from 'node:child_process';
import { readFileSync, statSync } from 'node:fs';
import { basename } from 'node:path';
import { safeJoin } from './manifest.js';
import { snippetHash } from './snapshot.js';

const SECRET_ADJACENT = [/^\.env(\.|$)/, /\.pem$/, /\.key$/];
/** Never render more than this per excerpt (matches manifest MAX_FILE_BYTES). */
const MAX_VIEW_BYTES = 256 * 1024;

export interface EvidenceView {
  pointerId: string;
  path: string;
  line_start?: number;
  line_end?: number;
  tier: string;
  description: string;
  withheld?: string;
  provenance?: string;
  lines?: { n: number; text: string; cited: boolean }[];
  hashCheck?: string;
}

/** Read-only source excerpt for one evidence pointer. Never uploads anything. */
export function viewEvidence(input: {
  repo: string;
  revision: string;
  pointer: {
    id: string;
    path?: string;
    line_start?: number;
    line_end?: number;
    tier: string;
    description: string;
    snippet_hash?: string;
  };
}): EvidenceView {
  const base: EvidenceView = {
    pointerId: input.pointer.id,
    path: input.pointer.path ?? '(no path)',
    tier: input.pointer.tier,
    description: input.pointer.description,
    ...(input.pointer.line_start !== undefined ? { line_start: input.pointer.line_start } : {}),
    ...(input.pointer.line_end !== undefined ? { line_end: input.pointer.line_end } : {}),
  };
  const rel = input.pointer.path;
  if (rel === undefined || rel === '') return { ...base, withheld: 'pointer cites no file path' };
  if (rel.includes('..') || rel.startsWith('/') || /^[a-zA-Z]:/.test(rel)) {
    return { ...base, withheld: 'path escapes the repository' };
  }
  if (SECRET_ADJACENT.some((rx) => rx.test(basename(rel)))) {
    return { ...base, withheld: 'content withheld: secret-adjacent file (cited by path only)' };
  }
  let text: string | null = null;
  let provenance = '';
  try {
    const sizeOut = execFileSync('git', ['-C', input.repo, 'cat-file', '-s', `${input.revision}:${rel}`], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }) as string;
    if (Number.parseInt(sizeOut.trim(), 10) > MAX_VIEW_BYTES) {
      return { ...base, withheld: `file too large to display (${sizeOut.trim()} bytes at the cited revision)` };
    }
    text = execFileSync('git', ['-C', input.repo, 'show', `${input.revision}:${rel}`], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }) as string;
    provenance = `cited revision ${input.revision.slice(0, 7)} (git show)`;
  } catch {
    try {
      const abs = safeJoin(input.repo, rel);
      if (statSync(abs).size > MAX_VIEW_BYTES) {
        return { ...base, withheld: 'file too large to display in the worktree' };
      }
      text = readFileSync(abs, 'utf8');
      provenance = 'current worktree — cited revision unavailable in this clone (content may differ)';
    } catch {
      return { ...base, withheld: 'file unreadable in this repository' };
    }
  }
  const lines = (text as string).split('\n');
  const start = Math.max(1, (input.pointer.line_start ?? 1) - 3);
  const end = Math.min(lines.length, (input.pointer.line_end ?? input.pointer.line_start ?? 1) + 3);
  const rows = [];
  for (let n = start; n <= end; n += 1) {
    rows.push({
      n,
      text: lines[n - 1] ?? '',
      cited: n >= (input.pointer.line_start ?? 1) && n <= (input.pointer.line_end ?? input.pointer.line_start ?? 1),
    });
  }
  let hashCheck = 'no ledger hash to check against';
  if (input.pointer.snippet_hash !== undefined && input.pointer.line_start !== undefined && input.pointer.line_end !== undefined) {
    try {
      hashCheck = snippetHash(text as string, input.pointer.line_start, input.pointer.line_end) === input.pointer.snippet_hash
        ? 'span verified: content matches the ledger snippet hash'
        : 'content differs from the ledger snippet hash — do not trust these lines as cited';
    } catch {
      hashCheck = 'hash check failed on this content';
    }
  }
  return { ...base, provenance, lines: rows, hashCheck };
}
