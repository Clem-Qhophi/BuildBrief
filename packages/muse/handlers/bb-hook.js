#!/usr/bin/env node
// bb-hook: turn-end / lifecycle CLI (BB-050, advisory by default).
// Reads ONE JSON document from stdin:
//   { provider, event | payload, session_id?, project_id?, gate?, enforcement? }
// Normalizes the provider event, evaluates the controlled gate, prints ONE
// JSON decision line to stdout, and ALWAYS exits 0: a crashing or blocking
// hook must never break the user's agent loop. Blocking ('block') is
// emitted only when enforcement is explicitly 'blocking' (proven transport);
// otherwise violations degrade to 'warn' and say so.
import { evaluateGate } from '../lib/gate.js';
import { normalizeHookEvent } from '../lib/normalize.js';

function readStdin() {
  return new Promise((resolve) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (c) => { data += c; });
    process.stdin.on('end', () => resolve(data));
    setTimeout(() => resolve(data), 1500);
  });
}

const raw = await readStdin();
let input = null;
try {
  input = raw.trim().length > 0 ? JSON.parse(raw) : null;
} catch {
  input = null;
}

if (input === null || typeof input !== 'object' || Array.isArray(input)) {
  process.stdout.write(`${JSON.stringify({ decision: 'allow', reason: 'empty or unparseable hook input; nothing to judge', event: null, gate: null })}\n`);
  process.exit(0);
}

const provider = typeof input.provider === 'string' ? input.provider : 'muse';
const payload = input.event !== undefined ? input.event : (input.payload !== undefined ? input.payload : null);
const normalized = normalizeHookEvent(provider, payload);
const gateInput = input.gate !== undefined && input.gate !== null && typeof input.gate === 'object' ? input.gate : {};
const gate = evaluateGate({ ...gateInput, enforcement: input.enforcement ?? gateInput.enforcement ?? 'advisory' });

let decision = 'allow';
if (gate.disposition === 'blocked') decision = 'block';
else if (gate.disposition === 'advisory' || gate.disposition === 'escalate_human') decision = 'warn';

process.stdout.write(`${JSON.stringify({
  decision,
  reason: gate.reason,
  event: normalized,
  gate: { disposition: gate.disposition, loops: gate.loops, autopsy_prompt: gate.autopsy_prompt },
})}\n`);
process.exit(0);
