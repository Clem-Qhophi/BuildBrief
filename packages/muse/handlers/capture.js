#!/usr/bin/env node
// bb-hook-capture: UserPromptSubmit handler. Fast, defensive, observable.
// Reads the hook payload from stdin, extracts the user prompt text on a
// best-effort basis (payload shape varies by Muse version - never crash),
// appends a raw capture record, and exits 0. All interpretation happens later
// in `bb capture`; this hook never approves anything.
import { appendFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const LOG_DIR = process.env.BB_HOOK_LOG_DIR ?? join(tmpdir(), 'bb-hook-probe');

function readStdin() {
  return new Promise((resolve) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (c) => { data += c; });
    process.stdin.on('end', () => resolve(data));
    setTimeout(() => resolve(data), 1500);
  });
}

function extractPrompt(payload) {
  if (typeof payload === 'string') {
    try {
      return extractPrompt(JSON.parse(payload));
    } catch {
      return payload.slice(0, 4000);
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
    if (typeof c === 'string' && c.length > 0) return c.slice(0, 4000);
  }
  return JSON.stringify(payload).slice(0, 4000);
}

const raw = await readStdin();
mkdirSync(LOG_DIR, { recursive: true });
appendFileSync(
  join(LOG_DIR, 'captured.jsonl'),
  JSON.stringify({ at: new Date().toISOString(), prompt: extractPrompt(raw), rawBytes: raw.length }) + '\n',
);
process.exit(0);
