import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { approveIntent, contentHash, type IntentVersion } from '@buildbrief/domain';
import { RuleAssessor, verify } from '@buildbrief/verifier';
import {
  answerQuiz,
  comprehensionMap,
  explainFeature,
  gradeResponse,
  makeQuiz,
  retireStale,
  roleTour,
} from '../src/index.js';

function git(cwd: string, args: string[]): void {
  execFileSync('git', args, { cwd, stdio: 'ignore' });
}

async function setup() {
  const root = mkdtempSync(join(tmpdir(), 'bb-learn-'));
  mkdirSync(join(root, 'src'), { recursive: true });
  writeFileSync(
    join(root, 'src', 'referral.js'),
    '// Generate referral code. Referral code expiry days.\nexport const EXPIRY_DAYS = 30;\nexport function generateReferralCode() { return "R-1"; }\n',
  );
  git(root, ['init', '-q']);
  git(root, ['config', 'user.email', 't@t.t']);
  git(root, ['config', 'user.name', 't']);
  git(root, ['add', '-A']);
  git(root, ['commit', '-qm', 'base']);
  const draft: IntentVersion = {
    id: 'bb_intent_learn',
    project_id: 'p1',
    feature_id: 'referral',
    version: 1,
    kind: 'feature',
    state: 'draft',
    exact_source_text: 'Generate referral code with expiry days.',
    source_hash: contentHash('x'),
    captured_at: '2026-10-27T10:00:00.000Z',
    capture_completeness: 'manual',
    normalized_text: 'referral codes with expiry',
    criteria: [
      { id: 'c-gen', text: 'Generate referral code', keywords: ['referral', 'generate'] },
      { id: 'c-exp', text: 'Referral code expiry days', keywords: ['expir', 'days'] },
    ],
    non_goals: [],
    constraints: [],
    ambiguity_flags: [],
  };
  const approved = approveIntent({ intent: draft, actor: 'owner' });
  assert.equal(approved.ok, true);
  if (!approved.ok) throw new Error('approve failed');
  const report = await verify({ projectId: 'p1', intent: approved.intent, root, provider: new RuleAssessor(), runId: 'bb_run_learn' });
  return { root, intent: approved.intent, report };
}

describe('understanding studio slice', () => {
  it('explains from findings with explicit unknowns', async () => {
    const { intent, report } = await setup();
    const ex = explainFeature(intent, report);
    assert.ok(ex.summary.includes('referral'));
    assert.equal(ex.rules.length, 2);
    assert.ok(ex.rules.every((r) => r.evidence.length > 0 || r.missing_proof.length > 0 || r.finding === 'supported'));
    assert.equal(ex.revision, report.checked_revision);
  });

  it('generates locate+predict, grades locate, holds predict for humans', async () => {
    const { intent, report } = await setup();
    const quizzes = makeQuiz({ projectId: 'p1', intent, report });
    assert.equal(quizzes.length, 2);
    assert.deepEqual(quizzes.map((q) => q.type), ['locate', 'predict']);
    assert.ok(quizzes.every((q) => q.status === 'draft' && q.evidence_ids.length > 0));

    const byId = new Map(report.results.flatMap((r) => r.evidence.map((e) => [e.id, e] as const)));
    const locate = quizzes[0];
    if (locate === undefined) throw new Error('no locate quiz');
    const evidence = locate.evidence_ids.map((id) => byId.get(id)).filter((e) => e !== undefined);
    const good = answerQuiz({ quiz: locate, actor: 'learner', text: 'src/referral.js lines 1-3', evidence });
    assert.equal(good.graded, 'pass');
    assert.equal(good.graded_by, 'bb-locate-v1');
    const bad = answerQuiz({ quiz: locate, actor: 'learner', text: 'src/auth.js', evidence });
    assert.equal(bad.graded, 'fail');

    const predict = quizzes[1];
    if (predict === undefined) throw new Error('no predict quiz');
    const open = answerQuiz({ quiz: predict, actor: 'learner', text: 'codes stop working after a month', evidence: [] });
    assert.equal(open.graded, 'pending');
    const human = gradeResponse(open, 'pass', 'owner');
    assert.equal(human.graded, 'pass');
    assert.equal(human.graded_by, 'owner');
  });

  it('retires questions whose evidence moved', async () => {
    const { root, intent, report } = await setup();
    const quizzes = makeQuiz({ projectId: 'p1', intent, report });
    const byId = new Map(report.results.flatMap((r) => r.evidence.map((e) => [e.id, e] as const)));
    const same = retireStale(quizzes, report.checked_revision, new Map(), byId);
    assert.ok(same.every((q) => q.status === 'draft'));

    // Rewrite the file so cited snippets no longer match.
    writeFileSync(join(root, 'src', 'referral.js'), 'export const GONE = 1;\n');
    const current = new Map([['src/referral.js', 'export const GONE = 1;\n']]);
    const retired = retireStale(quizzes, 'newsha', current, byId);
    assert.ok(retired.every((q) => q.status === 'retired'));

    const answered = quizzes[0];
    if (answered === undefined) throw new Error('no quiz');
    assert.throws(
      () => answerQuiz({ quiz: { ...answered, status: 'retired' }, actor: 'l', text: 'x', evidence: [] }),
      /retired/,
    );
  });

  it('maps comprehension states without inventing data', () => {
    const q = (id: string, cid: string, rev: string, status: 'draft' | 'retired'): Parameters<typeof comprehensionMap>[0]['quizzes'][number] => ({
      id,
      project_id: 'p',
      revision: rev,
      criterion_ids: [cid],
      type: 'locate',
      prompt: 'p',
      rubric: ['r'],
      evidence_ids: [],
      difficulty: 1,
      status,
    });
    const r = (id: string, qid: string, graded: 'pass' | 'fail' | 'pending'): Parameters<typeof comprehensionMap>[0]['responses'][number] => ({
      id,
      quiz_id: qid,
      actor_id: 'a',
      response_text: 't',
      graded,
      at: '2026-10-28T00:00:00.000Z',
    });
    const cells = comprehensionMap({
      criteria: [
        { id: 'c-demo', text: 't' },
        { id: 'c-strug', text: 't' },
        { id: 'c-pend', text: 't' },
        { id: 'c-untested', text: 't' },
        { id: 'c-stale', text: 't' },
        { id: 'c-none', text: 't' },
      ],
      findings: new Map([['c-demo', 'supported']]),
      quizzes: [
        q('q1', 'c-demo', 'R2', 'draft'),
        q('q2', 'c-strug', 'R2', 'draft'),
        q('q3', 'c-pend', 'R2', 'draft'),
        q('q4', 'c-untested', 'R2', 'draft'),
        q('q5', 'c-stale', 'R1', 'retired'),
      ],
      responses: [
        r('r1', 'q1', 'pass'),
        r('r2', 'q2', 'fail'),
        r('r3', 'q3', 'pending'),
        r('r4', 'q5', 'pass'),
      ],
      currentRevision: 'R2',
    });
    const byId = new Map(cells.map((c) => [c.criterion_id, c]));
    assert.equal(byId.get('c-demo')?.status, 'demonstrated');
    assert.equal(byId.get('c-strug')?.status, 'struggling');
    assert.equal(byId.get('c-pend')?.status, 'pending');
    assert.equal(byId.get('c-untested')?.status, 'untested');
    // The retired quiz's passing answer must not count.
    assert.equal(byId.get('c-stale')?.status, 'stale');
    assert.equal(byId.get('c-none')?.status, 'unmeasured');
    assert.equal(byId.get('c-demo')?.finding, 'supported');
    assert.equal(byId.get('c-none')?.finding, '—');
  });

  it('tours role briefs without inventing business policy', async () => {
    const { intent, report } = await setup();
    const mkt = roleTour({ projectId: 'p1', role: 'marketing', intent, report });
    assert.equal(mkt.role, 'marketing');
    assert.ok(mkt.unknowns.some((u) => /NOT established from code/i.test(u)));
    const blob = JSON.stringify(mkt.sections);
    assert.ok(!/\$\d/.test(blob), 'no fabricated prices in role brief');
    const eng = roleTour({ projectId: 'p1', role: 'engineer', intent, report, quizIds: ['q1'] });
    assert.deepEqual(eng.quiz_ids, ['q1']);
    assert.ok(eng.sections.some((s) => s.evidence_ids.length > 0));
  });
});
