#!/usr/bin/env node
// Reproducible MCP-driven slice of the referral demo (M2 section 5).
// Drives the real stdio MCP server: capture -> list -> approve -> verify -> fix.
// Prints the intent id, run id, and finding lines. Afterwards apply the v3 patch
// and run `bb recheck` (see DEMO.md). No mocks: every tool call executes bb.
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const [ledgerDir, repoDir, baseSha] = process.argv.slice(2);
if (!ledgerDir || !repoDir || !baseSha) {
  console.error('usage: mcp-loop.mjs <ledger-dir> <repo-dir> <base-sha>');
  process.exit(2);
}

const serverPath = fileURLToPath(new URL('../../packages/mcp/dist/src/serve.js', import.meta.url));
const server = spawn(process.execPath, [serverPath], {
  env: { ...process.env, BB_WORKSPACE: ledgerDir },
  stdio: ['pipe', 'pipe', 'inherit'],
});

let buffer = '';
const queue = [];
const waiters = [];
server.stdout.setEncoding('utf8');
server.stdout.on('data', (d) => {
  buffer += d;
  const lines = buffer.split('\n');
  buffer = lines.pop();
  for (const line of lines) {
    if (!line.trim()) continue;
    const reply = JSON.parse(line);
    const w = waiters.shift();
    if (w) w(reply);
    else queue.push(reply);
  }
});
const next = () => new Promise((resolve) => {
  const q = queue.shift();
  if (q) resolve(q);
  else waiters.push(resolve);
});
let id = 0;
async function call(tool, args) {
  server.stdin.write(JSON.stringify({ jsonrpc: '2.0', id: ++id, method: 'tools/call', params: { name: tool, arguments: args } }) + '\n');
  const reply = await next();
  if (reply.error) throw new Error(`${tool}: ${reply.error.message}`);
  return reply.result;
}

server.stdin.write(JSON.stringify({ jsonrpc: '2.0', id: ++id, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'mcp-loop', version: '0' } } }) + '\n');
await next();
server.stdin.write(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) + '\n');

const PROMPT = 'Add referral codes with 20 percent credit on first invoice. Codes expire after 30 days. Do not modify authentication.';
const cap = await call('bb_capture', { project: 'demo', feature: 'referral', prompt: PROMPT, agent: 'mcp-loop', session: 's-m2' });
console.log('CAPTURE:', cap.content[0].text);
const intentId = cap.content[0].text.split(' ')[1];

const listed = await call('bb_list_intents', { project: 'demo' });
console.log('LIST:', listed.content[0].text.trim());

const owner = process.env.BB_DEMO_ACTOR ?? 'owner-mcp';
const appr = await call('bb_approve_intent', { project: 'demo', intent: intentId, actor: owner });
console.log('APPROVE:', appr.content[0].text);

const ver = await call('bb_verify', { project: 'demo', intent: intentId, repo: repoDir, base: baseSha, provider: 'rules' });
console.log('VERIFY:\n' + ver.content[0].text);
const runId = ver.content[0].text.match(/run (\S+)/)?.[1];
if (!runId) throw new Error('no run id in verify output');

const fix = await call('bb_make_fix_brief', { project: 'demo', run: runId });
console.log('FIX (first 800 chars):\n' + fix.content[0].text.slice(0, 800));

console.log(`\nNEXT: apply v3 patch in ${repoDir}, commit, then:`);
console.log(`  node packages/cli/dist/src/main.js recheck --project demo --intent ${intentId} --repo ${repoDir} --base ${baseSha}`);
server.kill();
