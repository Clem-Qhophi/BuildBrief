import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
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

  it('capture records sha256 of the exact full prompt and flags truncation', async () => {
    const { createHash } = await import('node:crypto');
    const dir = mkdtempSync(join(tmpdir(), 'bb-hook-'));
    const full = `synthetic hook probe ${'x'.repeat(5000)}`;
    await run(CAPTURE, JSON.stringify({ prompt: full }), { BB_HOOK_LOG_DIR: dir });
    const rec = JSON.parse(readFileSync(join(dir, 'captured.jsonl'), 'utf8'));
    assert.equal(rec.prompt, full.slice(0, 4000));
    assert.equal(rec.promptLength, full.length);
    assert.equal(rec.truncated, true);
    assert.equal(rec.promptHash, createHash('sha256').update(full, 'utf8').digest('hex'));
  });

  it('capture preserves hook provenance and never approves', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'bb-hook-'));
    await run(
      CAPTURE,
      JSON.stringify({ prompt: 'synthetic provenance probe', session_id: 'sess-123', cwd: '/tmp/demo-proj' }),
      { BB_HOOK_LOG_DIR: dir },
    );
    const rec = JSON.parse(readFileSync(join(dir, 'captured.jsonl'), 'utf8'));
    assert.equal(rec.prompt, 'synthetic provenance probe');
    assert.equal(rec.source, 'hook');
    assert.equal(rec.sessionId, 'sess-123');
    assert.equal(rec.projectRoot, '/tmp/demo-proj');
    assert.ok(!('approved' in rec) && !('state' in rec) && !('approval' in rec));
  });

  it('capture exits 0 even when the log directory is unwritable', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'bb-hook-'));
    const blocker = join(dir, 'blocker');
    writeFileSync(blocker, 'not a directory', 'utf8');
    await run(CAPTURE, JSON.stringify({ prompt: 'unwritable probe' }), { BB_HOOK_LOG_DIR: blocker });
  });
});
