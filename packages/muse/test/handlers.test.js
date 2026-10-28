import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = fileURLToPath(new URL('.', import.meta.url));
const CAPTURE = join(HERE, '..', 'handlers', 'capture.js');
const GUARD = join(HERE, '..', 'handlers', 'guard.js');

function run(script, stdin, env = {}) {
  return new Promise((resolve, reject) => {
    const child = execFile(process.execPath, [script], { env: { ...process.env, ...env }, timeout: 15000 }, (error, stdout, stderr) => {
      if (error !== null) {
        reject(new Error(`${script} exited nonzero: ${stderr.slice(0, 500)}`));
        return;
      }
      resolve(stdout);
    });
    child.stdin.write(stdin);
    child.stdin.end();
  });
}

describe('hook handlers', () => {
  it('capture records exact prompt, preserves duplicates, never approves', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'bb-hook-'));
    const env = { BB_HOOK_LOG_DIR: dir };
    await run(CAPTURE, JSON.stringify({ prompt: 'Add referral codes.' }), env);
    await run(CAPTURE, JSON.stringify({ prompt: 'Add referral codes.' }), env);
    await run(CAPTURE, 'not-json{{{', env);
    const lines = readFileSync(join(dir, 'captured.jsonl'), 'utf8').trim().split('\n');
    assert.equal(lines.length, 3);
    assert.equal(JSON.parse(lines[0]).prompt, 'Add referral codes.');
    assert.equal(JSON.parse(lines[1]).prompt, 'Add referral codes.');
    assert.ok(JSON.parse(lines[2]).prompt.includes('not-json'));
  });

  it('capture tolerates empty stdin', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'bb-hook-'));
    await run(CAPTURE, '', { BB_HOOK_LOG_DIR: dir });
    const lines = readFileSync(join(dir, 'captured.jsonl'), 'utf8').trim().split('\n');
    assert.equal(lines.length, 1);
  });

  it('guard warns on protected paths, allows benign ones', async () => {
    const bad = JSON.parse(await run(GUARD, JSON.stringify({ tool: 'write', file_path: 'src/auth/middleware.ts' })));
    assert.equal(bad.decision, 'warn');
    assert.ok(bad.reason.includes('src/auth/middleware.ts'));
    const good = JSON.parse(await run(GUARD, JSON.stringify({ tool: 'write', file_path: 'src/referral.js' })));
    assert.equal(good.decision, 'allow');
  });

  it('guard never blocks and never crashes on garbage', async () => {
    const r = JSON.parse(await run(GUARD, '{{{garbage'));
    assert.equal(r.decision, 'allow');
  });
});
