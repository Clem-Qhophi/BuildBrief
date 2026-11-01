#!/usr/bin/env node
// bb-hook-capture: UserPromptSubmit handler. Fast, defensive, observable.
// Reads the hook payload from stdin, extracts the user prompt text on a
// best-effort basis (payload shape varies by Muse version - never crash),
// appends a raw capture record, and exits 0. All interpretation happens later
// in `bb capture`; this hook never approves anything.
import { appendFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const LOG_DIR = process.env.BB_HOOK_LOG_DIR ?? join(tmpdir(), 'bb-hook-probe');
const MAX_PROMPT_CHARS = 4000;

function readStdin() {
  return new Promise((resolve) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (c) => { data += c; });
    process.stdin.on('end', () => resolve(data));
    setTimeout(() => resolve(data), 1500);
  });
}

function firstString(payload, keys) {
  for (const k of keys) {
    const v = payload[k];
    if (typeof v === 'string' && v.length > 0) return v;
  }
  for (const nest of ['params', 'payload', 'hook', 'context']) {
    const inner = payload[nest];
    if (inner !== null && typeof inner === 'object' && !Array.isArray(inner)) {
      for (const k of keys) {
        const v = inner[k];
        if (typeof v === 'string' && v.length > 0) return v;
      }
    }
  }
  return undefined;
}

function extractPrompt(payload) {
  if (typeof payload === 'string') {
    try {
      return extractPrompt(JSON.parse(payload));
    } catch {
      return payload;
    }
  }
  if (payload === null || typeof payload !== 'object') return '';
  const candidates = [
    payload.prompt, payload.user_prompt, payload.userPrompt, payload.text,
    payload.message, payload.input,
    payload.params && payload.params.prompt,
    payload.payload && payload.payload.prompt,
  ];
  for (const c of candidates) {
    if (typeof c === 'string' && c.length > 0) return c;
  }
  return JSON.stringify(payload);
}

function sha256Hex(text) {
  return createHash('sha256').update(text, 'utf8').digest('hex');
}

const raw = await readStdin();
let parsed = null;
try {
  parsed = raw.trim().length > 0 ? JSON.parse(raw) : null;
} catch {
  parsed = null;
}
const full = parsed === null && raw.trim().length > 0 && raw.trim().startsWith('{')
  ? raw
  : extractPrompt(parsed === null ? raw : parsed);
const record = {
  at: new Date().toISOString(),
  source: 'hook',
  event: (parsed !== null && typeof parsed === 'object'
    ? firstString(parsed, ['hook_event_name', 'hookEventName', 'event_name', 'eventName', 'event'])
    : undefined) ?? 'unknown',
  prompt: full.slice(0, MAX_PROMPT_CHARS),
  promptLength: full.length,
  truncated: full.length > MAX_PROMPT_CHARS,
  promptHash: sha256Hex(full),
  rawBytes: raw.length,
};
if (parsed !== null && typeof parsed === 'object') {
  const sessionId = firstString(parsed, ['session_id', 'sessionId', 'sessionID']);
  if (sessionId !== undefined) record.sessionId = sessionId;
  const projectRoot = firstString(parsed, ['cwd', 'projectRoot', 'project_root', 'workspace', 'workspaceRoot', 'project']);
  if (projectRoot !== undefined) record.projectRoot = projectRoot;
  const agent = firstString(parsed, ['agent', 'agent_name', 'source_agent']);
  if (agent !== undefined) record.agent = agent;
}
try {
  mkdirSync(LOG_DIR, { recursive: true });
  appendFileSync(
    join(LOG_DIR, 'captured.jsonl'),
    `${JSON.stringify(record)}\n`,
  );
} catch {
  // Observable probe log only: never fail the user's prompt when unwritable.
}
process.exit(0);
