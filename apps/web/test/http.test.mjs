import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

// Opt in against a loopback server. Uses labeled fixtures and unique test projects.
const base = process.env['BB_WEB_TEST_URL'];
const repo = process.env['E2E_REPO'];
function url(path) { return new URL(path, base); }
function post(path, data) { return fetch(url(path), { method: 'POST', body: new URLSearchParams(data), redirect: 'manual' }); }
function location(response) { const value = response.headers.get('location'); assert.ok(value); return new URL(value, base); }
function decodeLink(value) { return value.replaceAll('&amp;', '&'); }

test('HTTP: the landing page keeps the idea in the picture and links the evidence map', { skip: !base }, async () => {
  const page = await (await fetch(url('/'))).text();
  assert.match(page, /Build what you intended/);
  assert.match(page, /Not just what AI understood/);
  assert.match(page, /More than a check/);
  assert.match(page, /id="product-map"/);
  for (const path of ['/start', '/demo?scenario=reset', '/connect?project=&amp;method=github']) assert.ok(page.includes(`href="${path}"`));
  // The human-section illustration is generated and must stay labeled as such.
  assert.match(page, /Illustrative, AI-generated scene/);
});

test('HTTP: the home map uses stored example reports, retains probe context, and excludes private projects', { skip: !base, timeout: 120_000 }, async () => {
  const created = await post('/api/example', { scenario: 'reset', return: 'home' });
  assert.equal(created.status, 307);
  const homeUrl = location(created);
  assert.equal(homeUrl.pathname, '/');
  assert.equal(homeUrl.hash, '#product-map');
  const project = homeUrl.searchParams.get('example');
  assert.match(project, /^example-reset-[a-f0-9]{8}$/);
  const home = await (await fetch(homeUrl)).text();
  assert.match(home, /data-atlas-mode="explore"/);
  assert.match(home, /Seeded example/);
  assert.match(home, /Read the evidence without the map/);
  const reportLink = home.match(/href="([^"]+)">Open the real example report<\/a>/)?.[1];
  assert.ok(reportLink);
  const report = await (await fetch(url(decodeLink(reportLink)))).text();
  assert.match(report, /Your connected evidence/);
  assert.match(report, /3.*?failed/s);
  for (const [version, expected] of [['before', 'opened'], ['after', 'blocked']]) {
    const probe = await post('/api/example/probe', { project, version, age: '31', return: 'home' });
    const target = location(probe);
    assert.equal(target.pathname, '/');
    assert.equal(target.searchParams.get('example'), project);
    assert.equal(target.searchParams.get('build'), version);
    const observed = await (await fetch(target)).text();
    assert.match(observed, new RegExp(`The recovery link was ${expected}|The recovery link ${expected}`));
    assert.match(observed, new RegExp(`data-atlas-version="${version}"`));
  }
  const privateProject = `test-private-${randomUUID().slice(0, 8)}`;
  const marker = `Private requirement ${randomUUID()}`;
  await post('/api/start', { project: privateProject, idea: marker, behaviors: marker });
  const excluded = await (await fetch(url(`/?example=${privateProject}`))).text();
  assert.equal(excluded.includes(marker), false);
  assert.equal(excluded.includes('data-atlas-mode='), false);
  assert.match(excluded, /Preview|preview/);
});

test('HTTP: connect validates, saves a repository, preserves context, and captures a draft', { skip: !base || !repo }, async () => {
  assert.ok(['localhost', '127.0.0.1', '[::1]'].includes(new URL(base).hostname), 'Tests must target loopback.');
  const project = `test-connection-${randomUUID().slice(0, 8)}`;
  const bad = await post('/api/connect', { project, repo: 'https://example.com/repo' });
  assert.equal(bad.status, 307);
  const errorPage = await (await fetch(location(bad))).text();
  assert.match(errorPage, /absolute local path/);
  assert.match(errorPage, /role="alert"/);
  const connected = await post('/api/connect', { project, repo });
  assert.equal(connected.status, 307);
  const cookie = connected.headers.get('set-cookie')?.split(';')[0];
  assert.ok(cookie?.startsWith('bb-project='));
  const form = await (await fetch(url('/new'), { headers: { cookie } })).text();
  assert.match(form, new RegExp(`name="project"[^>]*value="${project}"`));
  assert.match(form, /name="repo"[^>]*value="[^"]+"/);
  const capture = await post('/api/capture', { project, repo, feature: 'test-draft', prompt: 'Codes expire after 30 days.' });
  assert.equal(capture.status, 307);
  const draft = await (await fetch(location(capture))).text();
  assert.match(draft, /Approve this version/);
  assert.match(draft, /not approved/);
  const runs = await (await fetch(url(`/runs?project=${encodeURIComponent(project)}`))).text();
  assert.match(runs, /No verification runs for this project yet/);
  const settings = await (await fetch(url('/settings'), { headers: { cookie } })).text();
  assert.match(settings, /Repository connection test/);
  // The raw project id may appear in form values and navigation URLs (it is
  // the routing key), but never as a visible text label.
  assert.doesNotMatch(settings, new RegExp(`>${project}<`));
  assert.match(settings, /Model provider/);
});

test('HTTP: example produces stored before/after evidence, corrections, and handover', { skip: !base, timeout: 120_000 }, async () => {
  assert.ok(['localhost', '127.0.0.1', '[::1]'].includes(new URL(base).hostname));
  const created = await post('/api/example', { scenario: 'referral' });
  assert.equal(created.status, 307);
  const landing = location(created);
  assert.match(landing.searchParams.get('project') ?? '', /^example-referral-/);
  const project = landing.searchParams.get('project');
  const demo = await (await fetch(landing)).text();
  assert.match(demo, /not_established/);
  assert.match(demo, /E2_test/);
  assert.match(demo, /href="\/connect\?project=&amp;method=github">Connect a project<\/a>/);
  const beforeLink = demo.match(/href="([^"]+)">Inspect the original report<\/a>/)?.[1];
  const afterLink = demo.match(/href="([^"]+)">Inspect the recheck and test output<\/a>/)?.[1];
  assert.ok(beforeLink && afterLink);
  const beforeUrl = url(decodeLink(beforeLink));
  const afterUrl = url(decodeLink(afterLink));
  assert.notEqual(beforeUrl.pathname, afterUrl.pathname);
  const before = await (await fetch(beforeUrl)).text();
  const after = await (await fetch(afterUrl)).text();
  assert.match(before, /not_established/);
  assert.match(after, /supported.*?Codes expire after 30 days/s);
  assert.match(after, /improved/);
  assert.match(after, /node expiry.check.mjs/);
  assert.match(after, /Test runs \(.*?1.*?\)/s);
  const evidenceLink = after.match(/href="([^"]+)">view source<\/a>/)?.[1];
  assert.ok(evidenceLink);
  const evidence = await (await fetch(url(decodeLink(evidenceLink)))).text();
  assert.match(evidence, /span verified: content matches the ledger snippet hash/);
  assert.match(evidence, /Back to the run report/);
  const beforeRun = beforeUrl.pathname.split('/').at(-1);
  const fixed = await post('/api/fix', { project, run: beforeRun });
  assert.equal(fixed.status, 307);
  const packs = await (await fetch(location(fixed))).text();
  assert.match(packs, /Do NOT touch/);
  assert.match(packs, /pack-bb_run_/);
  const handoverLink = after.match(/href="([^"]+)">team handover<\/a>/)?.[1];
  assert.ok(handoverLink);
  const handover = await (await fetch(url(decodeLink(handoverLink)))).text();
  for (const role of ['engineer', 'founder', 'qa', 'marketing']) assert.match(handover, new RegExp(`<h2>${role}</h2>`));
  const studio = await (await fetch(url(`/map?project=${project}`))).text();
  assert.match(studio, /Open explanation &amp; questions/);
  const empty = await post('/api/capture', { project, prompt: '' });
  assert.equal(empty.status, 400);
  const noProject = await post('/api/capture', { prompt: 'Codes expire after 30 days.' });
  assert.equal(noProject.status, 400);

test('HTTP: quiz studio renders grounded sections for a checked project', { skip: !base, timeout: 120_000 }, async () => {
  assert.ok(['localhost', '127.0.0.1', '[::1]'].includes(new URL(base).hostname));
  const created = await post('/api/example', { scenario: 'referral' });
  assert.equal(created.status, 307);
  const landing = location(created);
  const project = landing.searchParams.get('project') ?? '';
  assert.match(project, /^example-referral-/);
  const studio = await (await fetch(url(`/quiz?project=${encodeURIComponent(project)}`))).text();
  assert.match(studio, /Test yourself/);
  assert.match(studio, /By feature/);
  assert.match(studio, /By category/);
  assert.match(studio, /General mixed/);
  assert.match(studio, /referral/);
  assert.match(studio, /Generate &amp; take the quiz/);
  const room = await (await fetch(url(`/workspace?project=${encodeURIComponent(project)}`))).text();
  assert.match(room, /Attention queue/);
  assert.match(room, /Detail level/);
  assert.match(room, /Where things stand/);
  assert.match(before, /Coverage of this check/);
  assert.match(before, /requirements established/);
  const readiness = await (await fetch(url(`/readiness?project=${encodeURIComponent(project)}`))).text();
  assert.match(readiness, /Release readiness/);
  assert.match(readiness, /Known limitations/);
  const activity = await (await fetch(url(`/activity?project=${encodeURIComponent(project)}`))).text();
  assert.match(activity, /Agent activity/);
  assert.match(activity, /No agent sessions recorded/);
  assert.match(activity, /bb init/);
});
  const unknown = await post('/api/verify', { project, intent: 'bb_intent_nope', repo: afterUrl.searchParams.get('repo') });
  assert.equal(unknown.status, 404);
});

test('HTTP: an idea starts without a repository and its approved contract survives connecting code', { skip: !base || !repo }, async () => {
  const project = `test-idea-${randomUUID().slice(0, 8)}`;
  const capture = await post('/api/start', { project, idea: 'A private reading journal.', audience: 'Busy readers.', behaviors: 'Save a book note. Find notes by book title.', boundaries: 'No payments.', questions: 'Should notes be exportable?' });
  assert.equal(capture.status, 307);
  const draftUrl = location(capture);
  const intent = draftUrl.pathname.split('/').at(-1);
  const draft = await (await fetch(draftUrl)).text();
  assert.match(draft, /Idea stage/);
  assert.match(draft, /Busy readers/);
  assert.match(draft, /Save a book note/);
  assert.match(draft, /No payments/);
  assert.match(draft, /Should notes be exportable/);
  const briefUrl = url(`/api/brief?${new URLSearchParams({ project, intent })}`);
  assert.equal((await fetch(briefUrl)).status, 409);
  // A rejected draft must not execute its submitted acceptance command.
  const marker = `bb-draft-must-not-execute-${randomUUID()}.txt`;
  const rejected = await post('/api/verify', { project, intent, repo, accept: `node -e "require('fs').writeFileSync('${marker}','unexpected')"` });
  assert.equal(rejected.status, 307);
  assert.match(location(rejected).searchParams.get('error'), /Approve the requirements/);
  assert.equal(existsSync(join(repo, marker)), false);
  const approval = await post('/api/approve', { project, intent, actor: 'Synthetic HTTP test persona' });
  assert.equal(approval.status, 307);
  const handoff = await fetch(briefUrl);
  assert.equal(handoff.status, 200);
  assert.match(handoff.headers.get('content-disposition'), /attachment/);
  const text = await handoff.text();
  for (const expected of [intent, 'Busy readers.', 'No payments.', 'Should notes be exportable?', 'initialize Git']) assert.ok(text.includes(expected));
  const connected = await post('/api/connect', { project, intent, repo, method: 'local' });
  assert.equal(location(connected).pathname, draftUrl.pathname);
  const ready = await (await fetch(location(connected))).text();
  assert.match(ready, /approved by Synthetic HTTP test persona/);
  assert.match(ready, /Repository connected/);
  assert.match(ready, /name="repo"[^>]*value="[^"]+"/);
});

test('HTTP: reset behavior, acceptance output, immutable evidence, and human review agree', { skip: !base, timeout: 120_000 }, async () => {
  const created = await post('/api/example', { scenario: 'reset' });
  assert.equal(created.status, 307);
  const demoUrl = location(created);
  const project = demoUrl.searchParams.get('project');
  assert.match(project, /^example-reset-/);
  const demo = await (await fetch(demoUrl)).text();
  assert.match(demo, /3 of 5 recorded checks failed/);
  assert.match(demo, /5 of 5 recorded checks passed/);
  assert.match(demo, /Recovery form opened/);
  assert.match(demo, /This test breaks your requirement/);
  const beforeLink = demo.match(/href="([^"]+)">Inspect the original report<\/a>/)?.[1];
  const afterLink = demo.match(/href="([^"]+)">Inspect the recheck and test output<\/a>/)?.[1];
  assert.ok(beforeLink && afterLink);
  const beforeUrl = url(decodeLink(beforeLink));
  const afterUrl = url(decodeLink(afterLink));
  const before = await (await fetch(beforeUrl)).text();
  assert.match(before, /not_established.*?Password reset links expire after 30 minutes/s);
  assert.match(before, /A recorded acceptance check failed/);
  for (const [age, used, allowed] of [['31', '', false], ['30', '', false], ['5', '', true], ['5', 'yes', false]]) {
    const probe = await post('/api/example/probe', { project, version: 'after', age, used });
    assert.equal(probe.status, 307);
    const page = await (await fetch(location(probe))).text();
    assert.match(page, new RegExp(allowed ? 'Recovery form opened' : 'This link can’t be used'));
    assert.match(page, /This test matches your requirement/);
  }
  const after = await (await fetch(afterUrl)).text();
  assert.match(after, /supported.*?Password reset links expire after 30 minutes/s);
  assert.match(after, /Rules-based check · no model assessment/);
  assert.match(after, /E2_test/);
  const run = afterUrl.pathname.split('/').at(-1);
  const review = await post('/api/review', { run, project: 'forged-project', revision: 'forged-revision', actor: 'Synthetic review persona', outcome: 'changes_requested', note: 'Fixture review: test the real email flow before release.' });
  assert.equal(review.status, 307);
  assert.equal(location(review).searchParams.get('project'), project);
  const reviewed = await (await fetch(location(review))).text();
  assert.match(reviewed, /Changes requested/);
  assert.match(reviewed, /Synthetic review persona/);
  assert.match(reviewed, /supported.*?Password reset links expire after 30 minutes/s);
  // A human decision records a separate event; the original stored evidence is unchanged.
  const beforeAgain = await (await fetch(beforeUrl)).text();
  assert.match(beforeAgain, /not_established.*?Password reset links expire after 30 minutes/s);
});

test('HTTP: public GitHub import saves a snapshot without running repository code', { skip: !base || process.env['BB_WEB_TEST_GITHUB'] !== '1', timeout: 90_000 }, async () => {
  const project = `test-github-${randomUUID().slice(0, 8)}`;
  const connected = await post('/api/connect', { project, method: 'github', remote: 'https://github.com/octocat/Hello-World' });
  assert.equal(connected.status, 307);
  assert.equal(location(connected).pathname, '/new');
  const page = await (await fetch(location(connected))).text();
  assert.match(page, /Local copy from GitHub/);
  assert.match(page, /name="repo"[^>]*value="[^"]+checkouts[^"]+repository"/);
});
