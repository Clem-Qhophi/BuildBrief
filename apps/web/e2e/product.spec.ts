import { test, expect } from '@playwright/test';

test('public navigation leads to a real example and revision-bound reports', async ({ page }) => {
  test.setTimeout(120_000);
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Keep your idea in the picture.' })).toBeVisible();
  await expect(page.locator('.connected-home')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'You shouldn’t have to read every line to own the product.' })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Workspace' })).toHaveCount(0);
  await page.getByRole('link', { name: 'Features', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'A brief that follows the work.' })).toBeVisible();
  await page.getByRole('link', { name: 'Example', exact: true }).click();
  // Explicit fresh run keeps this test independent of any previously selected example.
  const fresh = page.getByText('How this example works', { exact: true });
  if (await fresh.count()) await fresh.click();
  const run = page.getByRole('button', { name: /Run (the working|a fresh) example/ });
  await run.click();
  await expect(page.getByText('The example ran.', { exact: false })).toBeVisible();
  await expect(page.locator('.demo-comparison')).toContainText('not_established');
  await expect(page.locator('.demo-comparison')).toContainText('E2_test');
  await expect(page.getByText('This test breaks your requirement.', { exact: true })).toBeVisible();
  await page.getByRole('radio', { name: 'Corrected build' }).check();
  await page.getByRole('button', { name: 'Open the recovery link' }).click();
  await expect(page.getByText('This test matches your requirement.', { exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Inspect the recheck and test output' }).click();
  await expect(page.getByRole('heading', { name: 'Record your review.' })).toBeVisible();
  await page.getByRole('link', { name: 'Technical view', exact: true }).click();
  await expect(page.getByRole('heading', { name: /supported.*Password reset links expire/ })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Test runs (1)' })).toBeVisible();
  await page.getByRole('navigation', { name: 'Workspace' }).getByRole('link', { name: 'Understand your product' }).click();
  await expect(page.getByRole('link', { name: 'Open explanation & questions' })).toBeVisible();
});

test('homepage runs the saved recovery example and shows its recorded result', async ({ page }) => {
  await page.goto('/');
  if (await page.locator('.trace-probe form').count() === 0) {
    await page.getByRole('button', { name: 'Load the real example' }).click();
    await expect(page.locator('.trace-probe form')).toHaveCount(1);
  }
  await page.getByRole('button', { name: 'Recorded checks' }).click();
  await page.getByText('Try the actual link', { exact: true }).click();
  await page.locator('.trace-probe select').selectOption('31');
  await page.locator('.trace-probe form').getByRole('button', { name: 'Open the recovery link' }).click();
  await expect(page).toHaveURL(/example=example-reset-[a-f0-9]{8}.*build=before.*#product-map/);
  await expect(page.locator('.trace-observation')).toContainText('31 minutes old');
  await expect(page.locator('.trace-observation')).toContainText('The recovery link opened.');
  await expect(page.locator('.trace-probe form p')).toContainText('Simulated account and clock');
});

test('landing leads to the no-repository brief and an idea prefill survives', async ({ page }) => {
  const idea = 'A quiet reading journal that helps me remember one useful insight from each book.';
  await page.goto('/');
  await page.getByRole('link', { name: 'Start with your idea' }).click();
  await expect(page).toHaveURL(/\/start/);
  await expect(page.getByLabel('What are you building?')).toBeVisible();
  await page.goto(`/start?idea=${encodeURIComponent(idea)}`);
  await expect(page.getByLabel('What are you building?')).toHaveValue(idea);
  await expect(page.getByText('No repository, account, or paid API call is needed.', { exact: true })).toBeVisible();
});

test('saved workspace projects have recognizable labels rather than internal ids', async ({ page }) => {
  await page.goto('/workspace');
  const projects = page.locator('.saved-projects');
  await expect(projects).toContainText('Other saved projects');
  await projects.locator('summary').click();
  const labels = await projects.getByRole('link').allTextContents();
  expect(labels.length).toBeGreaterThan(0);
  expect(labels.every((label) => !/^(?:example|test)-/i.test(label.trim()))).toBe(true);
});

test('connecting validates inline and retains repository across navigation', async ({ page }) => {
  const repo = process.env['E2E_REPO'];
  test.skip(!repo, 'E2E_REPO points to an owner-provisioned fixture checkout.');
  const project = `connection-${Date.now().toString(36)}`;
  await page.goto('/connect?project=&repo=');
  await page.getByLabel('Project name', { exact: true }).fill(project);
  await page.getByLabel('Repository directory', { exact: true }).fill('https://example.com/repo');
  await page.getByRole('button', { name: 'Connect repository & continue' }).click();
  await expect(page.locator('.notice.error')).toContainText('absolute local path');
  await expect(page.getByLabel('Project name', { exact: true })).toHaveValue(project);
  await page.getByLabel('Repository directory', { exact: true }).fill(repo!);
  await page.getByRole('button', { name: 'Connect repository & continue' }).click();
  await expect(page.getByRole('heading', { name: 'New intent' })).toBeVisible();
  await expect(page.locator('input[name="project"]')).toHaveValue(project);
  await expect(page.locator('input[name="repo"]')).not.toHaveValue('');
  await page.getByRole('navigation', { name: 'Workspace' }).getByRole('link', { name: 'Checks & evidence' }).click();
  await expect(page.getByRole('main')).toContainText('No verification runs for this project yet.');
  await page.getByRole('navigation', { name: 'Workspace' }).getByRole('link', { name: 'Describe a feature' }).click();
  await expect(page.locator('input[name="project"]')).toHaveValue(project);
  await expect(page.locator('input[name="repo"]')).not.toHaveValue('');
});

test('a new project can start with intent and download an approved build handoff without a repository', async ({ page }) => {
  await page.goto('/start');
  await page.getByLabel('Project name', { exact: true }).fill(`idea-browser-${Date.now().toString(36)}`);
  await page.getByLabel('What are you building?', { exact: true }).fill('A private reading journal for this synthetic test.');
  await page.getByLabel('What should a user be able to do?', { exact: true }).fill('Save a book note. Find a book by title.');
  await page.getByRole('button', { name: 'Create my draft brief' }).click();
  await expect(page.getByText('Idea stage · no repository yet', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Approve', exact: true })).toBeVisible();
  await page.getByPlaceholder('Your name (owner)').fill('Synthetic browser test persona');
  await page.getByRole('button', { name: 'Approve this version' }).click();
  await expect(page.getByRole('heading', { name: 'Your brief is ready for the first build.' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Download approved build brief' })).toHaveAttribute('href', /\/api\/brief\?/);
  await page.getByRole('link', { name: 'Connect the code when it exists' }).click();
  await expect(page.locator('input[name="intent"]')).toHaveValue(/^bb_intent_/);
});
