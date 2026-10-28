import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { approveIntent, contentHash, type IntentVersion } from '@buildbrief/domain';
import { RuleAssessor } from '../src/index.js';
import { autopsy, type AutopsyAttempt, packsForFailures, renderMarkdown, verify } from '../src/index.js';
import { headSha } from '@buildbrief/repo';
import { countResults, recordTestRun } from '@buildbrief/repo';

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

  it('gives each failure pack a distinct id (no ledger overwrite)', async () => {
    const { root, base } = seedRepo();
    const report = await verify({
      projectId: 'p1', intent: intent(), root,
      provider: new RuleAssessor(), baseRevision: base, runId: 'bb_run_multi',
    });
    // Duplicate the failing row with a second finding id: same run, two failures.
    const failing = report.results.filter((r) => r.finding.finding !== 'supported');
    assert.ok(failing.length >= 1);
    const second = {
      ...failing[0],
      finding: { ...(failing[0] as (typeof failing)[number]).finding, id: 'bb_finding_second' },
    };
    const packs = packsForFailures({
      id: 'pack-bb_run_multi', projectId: 'p1', intent: intent(),
      results: [...report.results, second as (typeof report.results)[number]],
      at: report.created_at,
    });
    assert.equal(packs.length, 2);
    assert.notEqual(packs[0]?.id, packs[1]?.id);
    assert.deepEqual(packs[0]?.finding_ids, [(failing[0] as (typeof failing)[number]).finding.id]);
    assert.deepEqual(packs[1]?.finding_ids, ['bb_finding_second']);
  });

  it('persists attached test runs in the report and renderers', async () => {
    const { root, base } = seedRepo();
    const head = headSha(root) as string;
    const log = 'ok 1 - referral generate\nok 2 - credit math\n';
    const { passed, failed } = countResults(log);
    const report = await verify({
      projectId: 'p1', intent: intent(), root,
      provider: new RuleAssessor(), baseRevision: base, runId: 'bb_run_tests',
      testRuns: [{
        run: recordTestRun({
          id: 'bb_testrun_1', revision: head, command: ['node', '--test'],
          exit_code: 0, passed, failed, log,
          started_at: '2026-10-27T00:00:00.000Z', finished_at: '2026-10-27T00:00:01.000Z',
        }),
        covers: ['src/referral.js'],
      }],
      at: '2026-10-27T00:00:02.000Z',
    });
    assert.equal(report.test_runs.length, 1);
    assert.equal(report.test_runs[0]?.run.id, 'bb_testrun_1');
    assert.deepEqual(report.test_runs[0]?.covers, ['src/referral.js']);
    // Raw logs never enter the report — only the content hash.
    assert.ok(!JSON.stringify(report).includes('referral generate'));
    const md = renderMarkdown(report);
    assert.ok(md.includes('## Test runs'));
    assert.ok(md.includes('node --test'));
    assert.ok(md.includes('exit 0, passed 2, failed 0'));
  });

  it('says plainly when no tests were recorded', async () => {
    const { root, base } = seedRepo();
    const report = await verify({
      projectId: 'p1', intent: intent(), root,
      provider: new RuleAssessor(), baseRevision: base, runId: 'bb_run_notests',
    });
    assert.deepEqual(report.test_runs, []);
    assert.ok(renderMarkdown(report).includes('No test runs recorded'));
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

describe('prompt autopsy', () => {
  const attempt = (over: Partial<AutopsyAttempt> & { run_id: string; revision: string }): AutopsyAttempt => ({
    finding: 'partial',
    grade: 'E1_source',
    rationale: 'some operative terms covered',
    missing_proof: ['expiry enforcement'],
    evidence: [{ path: 'src/referral.js', line_start: 1, line_end: 6, tier: 'E1_source' }],
    orphans: [],
    had_prior_pack: false,
    ...over,
  });

  it('refuses a single failed attempt and points at bb fix', () => {
    const r = autopsy({
      criterion_id: 'd-c1', criterion_text: 'Codes expire', constraint_paths: [],
      attempts: [attempt({ run_id: 'r1', revision: 'aaa' })],
    });
    assert.equal(r.ok, false);
    assert.match(r.ok === false ? r.reason : '', /at least two|bb fix/);
  });

  it('ignores supported findings when counting attempts', () => {
    const r = autopsy({
      criterion_id: 'd-c1', criterion_text: 'Codes expire', constraint_paths: [],
      attempts: [
        attempt({ run_id: 'r1', revision: 'aaa' }),
        { ...attempt({ run_id: 'r2', revision: 'bbb' }), finding: 'supported' },
      ],
    });
    assert.equal(r.ok, false);
  });

  it('dissects a seeded three-attempt history (blueprint timeline)', () => {
    // retry 1: partial, same module; retry 2: verdict moves, files shift (wrong
    // handler); retry 3: verdict back, test deleted. Mirrors §13.4 timeline.
    const r = autopsy({
      criterion_id: 'd-c2',
      criterion_text: 'Codes expire after 30 days',
      constraint_paths: ['src/auth.js'],
      attempts: [
        attempt({ run_id: 'r1', revision: 'aaaaaaa1' }),
        {
          ...attempt({ run_id: 'r2', revision: 'bbbbbbb2', had_prior_pack: true }),
          finding: 'not_established',
          rationale: 'no evidence retrieved',
          missing_proof: ['any expiry evidence'],
          evidence: [{ path: 'src/unrelated.js', line_start: 1, line_end: 3, tier: 'E1_source' }],
        },
        {
          ...attempt({ run_id: 'r3', revision: 'ccccccc3', had_prior_pack: true }),
          orphans: [{ path: 'test/referral.test.js', risk: 'high', flags: ['test_file_touched', 'deleted_test_or_suite'] }],
        },
      ],
    });
    if (r.ok !== true) {
      assert.fail(`expected ok autopsy: ${r.ok === false ? r.reason : 'unknown'}`);
      return;
    }
    const rep = r.report;
    assert.equal(rep.attempt_count, 3);
    assert.ok(rep.observed.some((l) => l.includes('attempt 1 @ aaaaaaa')), 'attempt revisions quoted');
    assert.ok(rep.observed.some((l) => l.includes('after a bounded correction pack')), 'pack lineage observed');
    assert.ok(rep.plausible_causes.some((l) => l.includes('guessing at the location')), 'file-shift cause');
    assert.ok(rep.plausible_causes.some((l) => l.includes('proof destroyed')), 'deleted-test cause');
    assert.ok(rep.unknowns.some((l) => l.includes('tests were run')), 'test-output unknown');
    assert.ok(rep.unknowns.some((l) => l.includes('never misconduct')), 'no-accusation unknown');
    assert.ok(rep.next_prompt.text.includes('Codes expire after 30 days'), 'goal present');
    assert.ok(rep.next_prompt.text.includes('src/referral.js') && rep.next_prompt.text.includes('src/unrelated.js'), 'allowed files union');
    assert.ok(rep.next_prompt.forbidden_files.includes('src/auth.js'), 'constraint path forbidden');
    assert.ok(rep.next_prompt.text.includes('what remains unresolved'), 'report line present');
  });

  it('names a stable-files stall differently from location guessing', () => {
    const r = autopsy({
      criterion_id: 'd-c1', criterion_text: 'Codes expire', constraint_paths: [],
      attempts: [
        attempt({ run_id: 'r1', revision: 'aaa' }),
        attempt({ run_id: 'r2', revision: 'bbb', had_prior_pack: true }),
      ],
    });
    if (r.ok !== true) {
      assert.fail('expected ok autopsy');
      return;
    }
    assert.ok(r.report.plausible_causes.some((l) => l.includes('unchanged (partial)')), 'stall named');
    assert.ok(r.report.plausible_causes.some((l) => l.includes('inside these files')), 'stable-files cause');
  });
});
