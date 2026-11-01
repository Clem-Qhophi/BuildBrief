import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { evaluateGate, buildAutopsyPrompt, MAX_GATE_LOOPS } from '../lib/gate.js';
import { normalizeHookEvent } from '../lib/normalize.js';

const HERE = fileURLToPath(new URL('.', import.meta.url));
const HOOK = join(HERE, '..', 'handlers', 'bb-hook.js');

function run(stdin) {
  return new Promise((resolve, reject) => {
    const child = execFile(process.execPath, [HOOK], { timeout: 15000 }, (error, stdout, stderr) => {
      if (error !== null) {
        reject(new Error(`bb-hook exited nonzero: ${stderr.slice(0, 500)}`));
        return;
      }
      resolve(stdout);
    });
    child.stdin.write(stdin);
    child.stdin.end();
  });
}

describe('hook normaliser', () => {
  it('maps known Muse lifecycle events', () => {
    assert.deepEqual(
      normalizeHookEvent('muse', { hook_event_name: 'Stop', session_id: 's1' }),
      { supported: true, name: 'turn_ended', captured_via: 'hook', provider: 'muse', session_id: 's1' },
    );
    assert.equal(normalizeHookEvent('muse', { event: 'PreToolUse' }).name, 'tool_proposed');
  });

  it('leaves gaps visible instead of inventing support', () => {
    assert.deepEqual(normalizeHookEvent('muse', { event: 'FancyFuture' }), {
      supported: false, reason: "unmapped muse event 'FancyFuture' (not claimed as captured)",
    });
    assert.equal(normalizeHookEvent('other-agent', {}).supported, false);
    assert.equal(normalizeHookEvent('muse', null).supported, false);
    assert.equal(normalizeHookEvent('muse', { no_event: 1 }).supported, false);
  });
});

describe('controlled gate', () => {
  it('opens on clean turns and caps automated loops at three', () => {
    assert.equal(MAX_GATE_LOOPS, 3);
    assert.equal(evaluateGate({}).disposition, 'open');
    assert.equal(evaluateGate({ loops: 2, deterministicFailures: ['exit 1'] }).disposition, 'advisory');
    const capped = evaluateGate({ loops: 3, deterministicFailures: ['exit 1'] });
    assert.equal(capped.disposition, 'escalate_human');
    assert.match(capped.reason, /owner decides/);
    assert.equal(capped.autopsy_prompt, null);
  });

  it('blocks only on proven transports, warns otherwise', () => {
    const input = { deterministicFailures: ['acceptance.mjs: exit 1'], protectedViolations: [], enforcement: 'blocking' };
    const blocked = evaluateGate(input);
    assert.equal(blocked.disposition, 'blocked');
    assert.equal(blocked.loops, 1);
    assert.ok((blocked.autopsy_prompt ?? '').includes('Acceptance:'));
    const advisory = evaluateGate({ ...input, enforcement: 'advisory' });
    assert.equal(advisory.disposition, 'advisory');
    assert.match(advisory.reason, /advisory only/);
    assert.ok((advisory.autopsy_prompt ?? '').length > 0);
  });

  it('treats model-only uncertainty as advisory and honours human override', () => {
    const uncertain = evaluateGate({ modelUncertainty: ['flow contradicts outcome?'] });
    assert.equal(uncertain.disposition, 'advisory');
    const over = evaluateGate({
      loops: 3,
      deterministicFailures: ['exit 1'],
      override: { reason: 'Accepted drift for the demo', actor: 'Owner' },
    });
    assert.equal(over.disposition, 'open');
    assert.match(over.reason, /Owner/);
  });

  it('autopsy prompts carry goal, evidence, attempts and constraints', () => {
    const prompt = buildAutopsyPrompt({
      goal: 'Expiry after 30 days',
      failures: ['acceptance.mjs exit 1'],
      evidence: ['src/referral.js L12'],
      tried: ['v1 fix'],
      constraints: ['do not touch auth'],
    });
    for (const needle of ['Expiry after 30 days', 'exit 1', 'L12', 'v1 fix', 'do not touch auth', 'new revision']) {
      assert.ok(prompt.includes(needle));
    }
  });
});

describe('bb-hook CLI', () => {
  it('blocks proven violations, warns elsewhere, never crashes', async () => {
    const block = JSON.parse(await run(JSON.stringify({
      provider: 'muse',
      event: { event: 'Stop', session_id: 's1' },
      enforcement: 'blocking',
      gate: { loops: 0, deterministicFailures: ['acceptance.mjs: exit 1'] },
    })));
    assert.equal(block.decision, 'block');
    assert.equal(block.event.name, 'turn_ended');
    assert.equal(block.gate.disposition, 'blocked');

    const warn = JSON.parse(await run(JSON.stringify({
      provider: 'muse',
      event: { event: 'Stop' },
      gate: { loops: 0, deterministicFailures: ['acceptance.mjs: exit 1'] },
    })));
    assert.equal(warn.decision, 'warn');

    const clean = JSON.parse(await run(JSON.stringify({ provider: 'muse', event: { event: 'Stop' }, gate: {} })));
    assert.equal(clean.decision, 'allow');

    const garbage = JSON.parse(await run('{{{garbage'));
    assert.equal(garbage.decision, 'allow');
  });
});
