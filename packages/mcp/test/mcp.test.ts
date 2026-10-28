import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { toolNames } from '../src/index.js';

const SERVE = join(fileURLToPath(new URL('.', import.meta.url)), '..', 'src', 'serve.js');

interface RpcReply {
  result?: { content?: { text?: string }[]; tools?: { name?: string }[]; protocolVersion?: string };
  error?: { code?: number; message?: string };
}

function startServer(workspace: string): {
  send: (msg: unknown) => void;
  next: () => Promise<RpcReply>;
  stop: () => void;
} {
  const child = spawn(process.execPath, [SERVE], {
    cwd: workspace,
    env: { ...process.env, BB_WORKSPACE: workspace },
    stdio: ['pipe', 'pipe', 'inherit'],
  });
  let buffer = '';
  const queue: RpcReply[] = [];
  const waiters: ((r: RpcReply) => void)[] = [];
  child.stdout.setEncoding('utf8');
  child.stdout.on('data', (d: string) => {
    buffer += d;
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      if (line.trim().length === 0) continue;
      const reply = JSON.parse(line) as RpcReply;
      const w = waiters.shift();
      if (w !== undefined) w(reply);
      else queue.push(reply);
    }
  });
  return {
    send: (msg: unknown) => child.stdin.write(`${JSON.stringify(msg)}\n`),
    next: () => new Promise<RpcReply>((resolve) => {
      const q = queue.shift();
      if (q !== undefined) resolve(q);
      else waiters.push(resolve);
    }),
    stop: () => child.kill(),
  };
}

describe('mcp stdio server', () => {
  it('handshakes, lists tools, captures and lists intents, rejects unknown tools', async () => {
    const workspace = mkdtempSync(join(tmpdir(), 'bb-mcp-'));
    const s = startServer(workspace);
    try {
      assert.deepEqual(toolNames(), [
        'bb_capture', 'bb_list_intents', 'bb_approve_intent', 'bb_get_context',
        'bb_verify', 'bb_report', 'bb_make_fix_brief',
      ]);
      s.send({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 't', version: '0' } } });
      const hello = await s.next();
      assert.equal(hello.result?.protocolVersion, '2024-11-05');

      s.send({ jsonrpc: '2.0', method: 'notifications/initialized' });
      s.send({ jsonrpc: '2.0', id: 2, method: 'tools/list' });
      const list = await s.next();
      assert.ok((list.result?.tools ?? []).some((t) => t.name === 'bb_verify'));

      s.send({
        jsonrpc: '2.0', id: 3, method: 'tools/call',
        params: { name: 'bb_capture', arguments: { project: 'p1', feature: 'f', prompt: 'Add referral codes. Do not modify auth.' } },
      });
      const cap = await s.next();
      const capText = cap.result?.content?.[0]?.text ?? '';
      assert.match(capText, /captured bb_intent_/);

      s.send({
        jsonrpc: '2.0', id: 4, method: 'tools/call',
        params: { name: 'bb_list_intents', arguments: { project: 'p1' } },
      });
      const listed = await s.next();
      assert.match(listed.result?.content?.[0]?.text ?? '', /\[draft\]/);

      s.send({ jsonrpc: '2.0', id: 5, method: 'tools/call', params: { name: 'bb_nope', arguments: {} } });
      const bad = await s.next();
      assert.equal(bad.error?.code, -32602);

      s.send({ jsonrpc: '2.0', id: 6, method: 'nope/method' });
      const missing = await s.next();
      assert.equal(missing.error?.code, -32601);
    } finally {
      s.stop();
    }
  });

  it('approve without actor is an isError result, not a crash', async () => {
    const workspace = mkdtempSync(join(tmpdir(), 'bb-mcp-'));
    const s = startServer(workspace);
    try {
      s.send({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 't', version: '0' } } });
      await s.next();
      s.send({
        jsonrpc: '2.0', id: 2, method: 'tools/call',
        params: { name: 'bb_approve_intent', arguments: { project: 'p1', intent: 'bb_intent_x' } },
      });
      const r = await s.next();
      assert.equal(r.result?.content?.[0]?.text?.includes('failed'), true);
    } finally {
      s.stop();
    }
  });
});
