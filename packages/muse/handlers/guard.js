#!/usr/bin/env node
// bb-guard: PreToolUse constraint guard (advisory in M2).
// Reads the tool-use payload from stdin, extracts candidate file paths on a
// best-effort basis, and compares them against protected paths from
// <workspace>/.buildbrief/policy.json plus built-in sensitive defaults.
// Prints one JSON verdict line to stdout and ALWAYS exits 0: blocking
// semantics for PreToolUse are unverified on this Muse build, so the guard
// warns loudly instead of inventing a block protocol. The ledger + reverse
// check remain the enforcement record (post-commit, human-disposed).
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve, sep } from 'node:path';

const SENSITIVE_DEFAULTS = [
  /(^|\/)auth(\/|[^/]*\.(ts|js|py|go|java)$)/i,
  /(^|\/)(login|session|password|token|oauth)(\/|[^/]*\.(ts|js|py|go|java)$)/i,
  /\.env(\.|$)/i,
  /\.pem$|\.key$/i,
  /(^|\/)migrations?\//i,
  /package-lock\.json|pnpm-lock\.yaml|yarn\.lock/i,
];

function readStdin() {
  return new Promise((resolveP) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (c) => { data += c; });
    process.stdin.on('end', () => resolveP(data));
    setTimeout(() => resolveP(data), 1500);
  });
}

function candidatePaths(payload) {
  const out = new Set();
  const visit = (v) => {
    if (typeof v === 'string') {
      if (/^[A-Za-z0-9_@./\\-][A-Za-z0-9_@./\\-]{0,260}\.[A-Za-z0-9]{1,10}$/.test(v)) out.add(v);
      return;
    }
    if (Array.isArray(v)) {
      v.forEach(visit);
      return;
    }
    if (v !== null && typeof v === 'object') {
      for (const [k, val] of Object.entries(v)) {
        if (/path|file|filename/i.test(k)) visit(val);
        else if (typeof val === 'object') visit(val);
      }
    }
  };
  visit(payload);
  return [...out];
}

function loadPolicy() {
  const roots = [process.env.BB_WORKSPACE, process.cwd()].filter(Boolean);
  for (const r of roots) {
    const p = join(resolve(String(r)), '.buildbrief', 'policy.json');
    if (existsSync(p)) {
      try {
        const parsed = JSON.parse(readFileSync(p, 'utf8'));
        if (Array.isArray(parsed.protected_paths)) return parsed.protected_paths.filter((x) => typeof x === 'string');
      } catch {
        return [];
      }
    }
  }
  return [];
}

const raw = await readStdin();
let payload = null;
try {
  payload = raw.trim().length > 0 ? JSON.parse(raw) : null;
} catch {
  payload = null;
}
const paths = payload === null ? [] : candidatePaths(payload);
const policy = loadPolicy();
const hits = [];
for (const p of paths) {
  const norm = p.split('\\').join('/');
  if (SENSITIVE_DEFAULTS.some((rx) => rx.test(norm))) {
    hits.push({ path: p, rule: 'sensitive-default' });
  } else if (policy.some((pp) => norm === pp || norm.startsWith(pp.endsWith('/') ? pp : `${pp}/`))) {
    hits.push({ path: p, rule: 'policy.json' });
  }
}
const verdict = hits.length === 0
  ? { decision: 'allow', reason: 'no protected paths in tool input', checked: paths }
  : {
    decision: 'warn',
    reason: `tool input touches protected paths: ${hits.map((h) => `${h.path} (${h.rule})`).join(', ')}. Owner approval required before writing; this advisory does not block.`,
    checked: paths,
    hits,
  };
process.stdout.write(`${JSON.stringify(verdict)}\n`);
process.exit(0);
