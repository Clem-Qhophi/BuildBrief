import { test } from 'node:test';
import assert from 'node:assert/strict';
import { findingLanguage, proofLanguage, projectName } from '../lib/presentation.ts';

test('plain-language results preserve uncertainty and evidence boundaries', () => {
  assert.equal(findingLanguage('not_established').label, 'Not enough proof');
  assert.match(findingLanguage('not_established').explanation, /does not prove/);
  assert.equal(findingLanguage('unknown').label, 'Not enough proof');
  assert.equal(proofLanguage('E1_source'), 'Code evidence only');
  assert.equal(proofLanguage('E2_test'), 'Includes recorded test evidence');
  assert.equal(projectName('example-reset-12345678'), 'Password recovery example · 5678');
  assert.equal(projectName('example-referral-abcdef12'), 'Referral credit example · ef12');
  assert.equal(projectName('test-github-7c54aa11'), 'GitHub import test · aa11');
  assert.equal(projectName('test-collection-7c54aa11'), 'Collection test · aa11');
  assert.equal(projectName('test-workspace-7c54aa11'), 'Workspace test · aa11');
  assert.equal(projectName('My product'), 'My product');
});
