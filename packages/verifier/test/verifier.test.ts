import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { approveIntent, contentHash, type IntentVersion } from '@buildbrief/domain';
import { RuleAssessor } from '../src/index.js';
import { packsForFailures, verify } from '../src/index.js';

function git(cwd: string, args: string[]): void {
  execFileSync('git', args, { cwd, stdio: 'ignore' });
}

function seedRepo(): { root: string; base: string } {
  const root = mkdtempSync(join(tmpdir(), 'bb-verify-'));
  mkdirSync(join(root, 'src'), { recursive: true });
  writeFileSync(join(root, 'src', 'referral.js'), '// referral code generation\nexport function makeCode() { return "R-" + Math.random(); }\n');
  writeFileSync(join(root, 'src', 'auth.js'), 'export function check(t) { return t === "ok"; }\n');
  git(root, ['init', '-q']);
  git(root, ['config', 'user.email', 't@t.t']);
  git(root, ['config', 'user.name', 't']);
  git(root, ['add', '-A']);
  git(root, ['commit', '-qm', 'base']);
  const base = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
  // Feature commit: referral credit without expiry + unrelated auth tweak.
  writeFileSync(
    join(root, 'src', 'referral.js'),
    '// referral code generation exists with credit\nexport function makeCode() { return "R-" + Math.random(); }\nexport function credit(invoice) { return invoice * 0.2; }\n',
  );
  writeFileSync(join(root, 'src', 'auth.js'), 'export function check(t) { return true; }\n');
  git(root, ['add', '-A']);
  git(root, ['commit', '-qm', 'feature']);
  return { root, base };
}

function intent(): IntentVersion {
  const draft: IntentVersion = {
    id: 'bb_intent_test1',
    project_id: 'p1',
    feature_id: 'referral',
    version: 1,
    kind: 'feature',
    state: 'draft',
    exact_source_text: 'Add referral codes with 20% credit. Codes expire after 30 days. Do not modify authentication.',
    source_hash: contentHash('x'),
    captured_at: '2026-10-27T10:00:00.000Z',
    capture_completeness: 'manual',
    normalized_text: 'referral codes; 20% credit; 30-day expiry; auth untouched',
    criteria: [
      { id: 'c-gen', text: 'Referral code generation exists', keywords: ['referral', 'makecode', 'code'] },
      { id: 'c-expiry', text: 'Referral codes expire 30 days after issue', keywords: ['expir', '30', 'days'] },
    ],
    non_goals: [],
    constraints: [{ rule: 'Do not modify authentication', paths: ['src/auth.js'], severity: 'critical' }],
    ambiguity_flags: [],
  };
  const r = approveIntent({ intent: draft, actor: 'owner' });
  assert.equal(r.ok, true);
  if (!r.ok) throw new Error('approve failed');
  return r.intent;
}

describe('verify pipeline', () => {
  it('supported vs not_established + orphan auth edit + packs', async () => {
    const { root, base } = seedRepo();
    const report = await verify({
      projectId: 'p1',
      intent: intent(),
      root,
      provider: new RuleAssessor(),
      baseRevision: base,
    });
    assert.match(report.checked_revision, /^[0-9a-f]{40}$/);
    const byId = new Map(report.results.map((r) => [r.criterion.id, r]));
    assert.equal(byId.get('c-gen')?.finding.finding, 'supported');
    assert.equal(byId.get('c-gen')?.finding.evidence_grade, 'E1_source');
    assert.equal(byId.get('c-expiry')?.finding.finding, 'not_established');
    assert.ok((byId.get('c-expiry')?.finding.missing_proof.length ?? 0) > 0);

    const orphanPaths = report.orphans.map((o) => o.path);
    assert.ok(orphanPaths.includes('src/auth.js'));
    const authOrphan = report.orphans.find((o) => o.path === 'src/auth.js');
    assert.equal(authOrphan?.risk, 'critical');
    assert.ok((authOrphan?.flags.includes('constraint_path_touched') ?? false));

    const packs = packsForFailures({ id: 'pack1', projectId: 'p1', intent: intent(), results: report.results, at: report.created_at });
    assert.equal(packs.length, 1);
    assert.ok((packs[0]?.do_not_touch.includes('src/auth.js') ?? false));
    assert.ok((packs[0]?.instructions.includes('re-run verification') ?? false));
  });

  it('refuses to verify unapproved intent', async () => {
    const { root } = seedRepo();
    const draft = intent();
    await assert.rejects(
      verify({ projectId: 'p1', intent: { ...draft, state: 'draft' }, root, provider: new RuleAssessor() }),
      /not approved/,
    );
  });
});
