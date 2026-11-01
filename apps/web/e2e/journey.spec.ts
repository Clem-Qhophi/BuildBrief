/**
 * BuildBrief end-to-end journey. OWNER-RUN ONLY — never executed in sandbox
 * (listening sockets are denied there, so `npm run web` cannot start).
 *
 * Architecture (deliberate): ONE journey test owns the whole workflow because
 * every step depends on the previous step's state (intent id, run id,
 * approval). Playwright isolates pages per test, so splitting the journey
 * across tests made later steps assert against empty pages and vacuous
 * conditional passes. Negative/security tests stay isolated with their own
 * prerequisites (N3 provisions its own intent + run via the API).
 * Tests run serially in file order as a convenience, not a dependency.
 *
 * The journey captures an expiry requirement the seeded repo does NOT satisfy
 * (before: not_established), applies the versioned v3 fix + functional check
 * as a real commit, and re-verifies (after: supported, E2_test). Re-seed
 * before every rerun — the journey mutates the repo it verifies.
 *
 * Prerequisites on the owner Windows machine:
 *   Terminal 1:
 *     cd C:\Projects\BuildBrief_Hackathon
 *     npm install; npx playwright install chromium   (one-time)
 *     node samples/demo-seed.mjs .\.demo-tmp\e2e-ledger .\.demo-tmp\e2e-repo e2e-base
 *     $env:BB_WORKSPACE = "$pwd\.demo-tmp\e2e-ledger"; npm run web
 *   Terminal 2:
 *     cd C:\Projects\BuildBrief_Hackathon
 *     $env:E2E_REPO = "$pwd\.demo-tmp\e2e-repo"
 *     npx playwright test --config apps/web/e2e/playwright.config.ts
 */
import { execSync } from 'node:child_process';
import { copyFileSync } from 'node:fs';
import { join } from 'node:path';
import { test, expect } from '@playwright/test';

const PROJECT = `e2e-${Date.now().toString(36)}`;
const REPO = process.env['E2E_REPO'] ?? '';

test.describe.configure({ mode: 'serial' });

test('buildbrief journey: connect to reverify to handover to export', async ({ page }) => {
  test.setTimeout(600_000);
  let intentId = '';
  let firstRunId = '';

  await test.step('connect shows workspace and ledger status', async () => {
    await page.goto('/connect');
    await expect(page.getByRole('heading', { name: 'Connect a project' })).toBeVisible();
    await expect(page.locator('body')).toContainText('Ledger');
  });

  await test.step('capture creates a draft intent', async () => {
    await page.goto('/new');
    await page.getByLabel(/Project/).fill(PROJECT);
    await page.getByLabel(/Feature/).fill('referral');
    await page.getByLabel(/What should be built/).fill(
      'Add referral codes with 20 percent credit on first invoice. Codes expire after 30 days. Do not modify authentication.',
    );
    await page.getByRole('button', { name: 'Capture draft intent' }).click();
    await expect(page.getByRole('heading', { name: 'Approve' })).toBeVisible();
    intentId = page.url().match(/\/intent\/([^?]+)/)?.[1] ?? '';
    expect(intentId).toMatch(/^bb_intent_/);
  });

  await test.step('draft shows criteria and approval gate', async () => {
    await expect(page.locator('.badge', { hasText: 'draft' })).toBeVisible();
    await expect(page.locator('table tbody td', { hasText: 'Add referral codes' })).toBeVisible();
    // Negative criterion is extracted out of the source <pre> into the
    // criteria table (and/or constraints list) — scope excludes the <pre>
    // echo so this proves extraction, not just prompt display.
    await expect(page.locator('table tbody td, ul li', { hasText: 'Do not modify authentication' })).toBeVisible();
    await expect(page.locator('table tbody td', { hasText: 'Codes expire after 30 days' })).toBeVisible();
  });

  await test.step('approve records the owner', async () => {
    await page.getByPlaceholder(/Your name/).fill('e2e-owner');
    await page.getByRole('button', { name: 'Approve this version' }).click();
    await expect(page.getByText('approved by e2e-owner')).toBeVisible();
  });

  await test.step('verify runs against the repo revision', async () => {
    expect(REPO, 'E2E_REPO must be set in this terminal').not.toBe('');
    await page.getByText('Connect code & check later', { exact: true }).click();
    await page.getByPlaceholder(/C:\\path/).fill(REPO);
    await page.getByRole('button', { name: 'Verify at current revision' }).click();
    await page.getByRole('link', { name: 'Technical view', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Findings' })).toBeVisible({ timeout: 90_000 });
    firstRunId = page.url().match(/\/run\/([^?]+)/)?.[1] ?? '';
    expect(firstRunId).toMatch(/^bb_run_/);
    // Genuine mismatch on the seeded (v2-equivalent) code: the expiry
    // criterion has no source evidence yet. Heading-level assertion targets
    // the finding row, never prose elsewhere on the page.
    await expect(
      page.getByRole('heading', { name: /not_established.*Codes expire after 30 days/ }),
    ).toBeVisible();
  });

  await test.step('finding links to viewable source evidence', async () => {
    await page.getByRole('link', { name: 'view source' }).first().click();
    await expect(page.getByRole('heading', { name: /Evidence/ })).toBeVisible();
    await expect(page.locator('body')).toContainText(/cited revision|current worktree/);
    await page.goBack();
  });

  await test.step('correction packs generate from failures', async () => {
    await page.getByRole('button', { name: 'Generate correction packs' }).click();
    await expect(page.getByText(/pack-bb_run_/).first()).toBeVisible();
    await expect(page.locator('body')).toContainText('Do NOT touch');
    await expect(page.locator('body')).toContainText(/Codes expire after 30 days/);
  });

  await test.step('reverify proves a GENUINE correction', async () => {
    // Real fix, never an empty commit: the 30-day expiry implementation plus
    // its functional check, copied from the versioned fixtures and committed.
    copyFileSync(
      join(process.cwd(), 'samples', 'referral-demo', 'v3', 'src', 'referral.js'),
      join(REPO, 'src', 'referral.js'),
    );
    copyFileSync(
      join(process.cwd(), 'samples', 'referral-demo', 'expiry.check.mjs'),
      join(REPO, 'expiry.check.mjs'),
    );
    const before = execSync('git rev-parse HEAD', { cwd: REPO, encoding: 'utf8' }).trim();
    const checkOut = execSync('node expiry.check.mjs', { cwd: REPO, encoding: 'utf8' });
    expect(checkOut).toContain('pass: EXPIRY_DAYS === 30');
    execSync('git add -A', { cwd: REPO });
    execSync('git commit -q -m "add 30-day expiry plus functional check"', { cwd: REPO });
    const after = execSync('git rev-parse HEAD', { cwd: REPO, encoding: 'utf8' }).trim();
    expect(after).not.toBe(before);
    await page.getByPlaceholder(/C:\\path/).fill(REPO);
    await page.getByPlaceholder(/npm test/).fill('node expiry.check.mjs');
    await page.getByPlaceholder(/src\/referral/).fill('src/referral.js');
    await page.getByRole('button', { name: /Re-verify/ }).click();
    await expect(page.getByRole('heading', { name: 'Findings' })).toBeVisible({ timeout: 90_000 });
    const secondRunId = page.url().match(/\/run\/([^?]+)/)?.[1] ?? '';
    expect(secondRunId).toMatch(/^bb_run_/);
    expect(secondRunId).not.toBe(firstRunId);
    await expect(page.locator('body')).toContainText(after.slice(0, 7));
    // The expiry criterion flipped on fresh evidence at the new revision…
    await expect(
      page.getByRole('heading', { name: /supported.*Codes expire after 30 days/ }),
    ).toBeVisible();
    // …and the passing acceptance run backs the source evidence (E2 grade).
    await expect(page.getByRole('heading', { name: 'Test runs (1)' })).toBeVisible();
    await expect(page.locator('body')).toContainText('E2_test');
  });

  await test.step('understanding studio renders grounded content', async () => {
    await expect(page.getByRole('heading', { name: 'Understanding Studio' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'What this run establishes' })).toBeVisible();
    await expect(page.locator('body')).not.toContainText('comprehension score');
  });

  await test.step('role tour switches through the real interface', async () => {
    await page.getByRole('link', { name: 'marketing', exact: true }).click();
    expect(page.url()).toContain('role=marketing');
    await expect(page.getByRole('heading', { name: 'Role tour (marketing)' })).toBeVisible();
  });

  await test.step('handover briefs every role', async () => {
    await page.getByRole('link', { name: 'team handover' }).click();
    for (const role of ['engineer', 'founder', 'qa', 'marketing']) {
      await expect(page.getByRole('heading', { name: role, exact: true })).toBeVisible();
    }
    await expect(page.locator('body')).toContainText('Nothing is invented');
  });

  await test.step('ledger export downloads JSONL', async () => {
    await page.goto('/settings');
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('link', { name: /Download the raw ledger/ }).click(),
    ]);
    expect(download.suggestedFilename()).toBe('buildbrief-events.jsonl');
  });
});

// Isolated negatives: each establishes its own prerequisites — none reads
// journey state, so file order is a convenience, not a dependency.
test('N1 empty prompt is rejected with 400', async ({ request }) => {
  const res = await request.post('/api/capture', {
    form: { project: PROJECT, feature: 'x', prompt: '' },
  });
  expect(res.status()).toBe(400);
});

test('N2 unknown intent is 404', async ({ request }) => {
  const res = await request.post('/api/verify', {
    form: { project: PROJECT, intent: 'bb_intent_nope', repo: 'C:\\nope' },
  });
  expect(res.status()).toBe(404);
});

test('N3 unknown evidence reference is refused', async ({ page, request }) => {
  // Self-provisions its own intent + run through the real API: no journey state.
  expect(REPO, 'E2E_REPO must be set in this terminal').not.toBe('');
  const n3project = `${PROJECT}-n3`;
  const cap = await request.post('/api/capture', {
    form: { project: n3project, feature: 'referral', prompt: 'N3 probe: referral codes exist.' },
    maxRedirects: 0,
  });
  expect([301, 302, 303, 307, 308]).toContain(cap.status());
  const intentId =
    (cap.headers()['location'] ?? '').match(/\/intent\/([^?]+)/)?.[1] ?? '';
  expect(intentId).toMatch(/^bb_intent_/);
  const ap = await request.post('/api/approve', {
    form: { project: n3project, intent: intentId, actor: 'n3-owner' },
    maxRedirects: 0,
  });
  expect([301, 302, 303, 307, 308]).toContain(ap.status());
  const ver = await request.post('/api/verify', {
    form: { project: n3project, intent: intentId, repo: REPO, provider: 'rules' },
    maxRedirects: 0,
    timeout: 90_000,
  });
  expect([301, 302, 303, 307, 308]).toContain(ver.status());
  const runId =
    (ver.headers()['location'] ?? '').match(/\/run\/([^?]+)/)?.[1] ?? '';
  expect(runId).toMatch(/^bb_run_/);
  await page.goto(`/evidence?run=${runId}&evidence=bb_ev_nope&repo=${encodeURIComponent(REPO)}`);
  await expect(page.getByRole('heading', { name: 'Evidence not found' })).toBeVisible();
});
