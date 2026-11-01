import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  CORRECTION_PROMPT_VERSION,
  EXTRACTION_PROMPT_VERSION,
  MODEL_TASK_PACKS,
  MODEL_TASKS,
  modelAllowedFor,
  UNDERSTANDING_PROMPT_VERSION,
  UNIVERSAL_PROHIBITIONS,
  VERIFY_PROMPT_VERSION,
  VERIFY_SYSTEM,
} from '../src/index.js';

describe('instruction packs', () => {
  it('versions every pack independently and wires the live system prompt', () => {
    assert.equal(VERIFY_PROMPT_VERSION, 'bb-verify-v2');
    for (const v of [CORRECTION_PROMPT_VERSION, UNDERSTANDING_PROMPT_VERSION, EXTRACTION_PROMPT_VERSION]) {
      assert.match(v, /^bb-[a-z]+-v\d+$/);
    }
    assert.ok(VERIFY_SYSTEM.includes('abstain') || VERIFY_SYSTEM.includes('Abstention'));
    for (const rule of UNIVERSAL_PROHIBITIONS) {
      assert.ok(VERIFY_SYSTEM.includes(rule.slice(0, 40)));
    }
  });

  it('allows the model only on the verify task', () => {
    assert.deepEqual([...MODEL_TASKS].sort(), ['correction', 'extraction', 'understanding', 'verify']);
    assert.equal(modelAllowedFor('verify'), true);
    for (const task of ['correction', 'understanding', 'extraction', 'billing', '']) {
      assert.equal(modelAllowedFor(task), false);
    }
    for (const task of MODEL_TASKS) {
      const pack = MODEL_TASK_PACKS[task];
      assert.ok(pack.rules.length >= UNIVERSAL_PROHIBITIONS.length);
      assert.ok(pack.version.length > 0);
    }
  });

  it('keeps the model out of deterministic packages by dependency', () => {
    // The niche boundary, enforced: product packages below must never
    // depend on model-meta (they stay deterministic). The verifier, CLI,
    // web app, and the eval harness (offline fixtures only, never live
    // calls in CI) are the only permitted importers.
    const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..');
    const readDeps = (dir: string): Record<string, string> => {
      const pkg = JSON.parse(readFileSync(join(root, dir, 'package.json'), 'utf8')) as {
        dependencies?: Record<string, string>;
      };
      return pkg.dependencies ?? {};
    };
    for (const name of ['domain', 'store', 'repo', 'learning', 'mcp', 'planning']) {
      assert.ok(!('@buildbrief/model-meta' in readDeps(join('packages', name))), `${name} must stay deterministic (no model-meta dependency)`);
    }
    for (const name of ['verifier', 'cli']) {
      assert.ok('@buildbrief/model-meta' in readDeps(join('packages', name)), `${name} must wire the provider`);
    }
    const web = readDeps(join('apps', 'web'));
    assert.ok('@buildbrief/model-meta' in web, 'web wires the provider for verify forms');
    assert.equal(existsSync(join(root, 'packages', 'model-meta', 'src', 'instructions.ts')), true);
  });
});
