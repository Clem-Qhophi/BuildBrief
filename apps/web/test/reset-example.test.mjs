import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { inspectResetLink as original } from '../../../samples/reset-demo/v2/src/recovery.mjs';
import { inspectResetLink as corrected } from '../../../samples/reset-demo/v3/src/recovery.mjs';

test('the recovery example demonstrates a real omission and preserves a working fresh-link flow', () => {
  assert.equal(original({ ageMinutes: 31 }).allowed, true);
  assert.equal(corrected({ ageMinutes: 31 }).allowed, false);
  assert.equal(corrected({ ageMinutes: 30 }).allowed, false);
  assert.equal(corrected({ ageMinutes: 29.999 }).allowed, true);
  assert.equal(corrected({ ageMinutes: 5 }).allowed, true);
  assert.equal(corrected({ ageMinutes: 5, alreadyUsed: true }).allowed, false);
  assert.equal(corrected({ ageMinutes: -1 }).allowed, false);
  assert.equal(corrected({ ageMinutes: Number.NaN }).allowed, false);
});
test('the unchanged acceptance command fails on the original fixture and passes on the correction', () => {
  const root = mkdtempSync(join(tmpdir(), 'bb-reset-check-'));
  const fixtures = fileURLToPath(new URL('../../../samples/reset-demo/', import.meta.url));
  try {
    for (const version of ['v2', 'v3']) {
      const target = join(root, version);
      mkdirSync(target);
      cpSync(join(fixtures, version, 'src'), join(target, 'src'), { recursive: true });
      cpSync(join(fixtures, 'acceptance.mjs'), join(target, 'acceptance.mjs'));
      let exit = 0;
      let output = '';
      try { output = execFileSync(process.execPath, ['acceptance.mjs'], { cwd: target, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }); }
      catch (e) { exit = e.status; output = String(e.stdout); }
      assert.equal(exit, version === 'v2' ? 1 : 0);
      assert.match(output, /fresh password reset link/);
      assert.match(output, version === 'v2' ? /FAIL: password reset links expire/ : /pass: password reset links expire/);
    }
  } finally { rmSync(root, { recursive: true, force: true }); }
});
