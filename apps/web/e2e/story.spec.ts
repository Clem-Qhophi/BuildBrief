import { test, expect, type Page } from '@playwright/test';

async function openMap(page: Page) {
  await page.goto('/');
  const load = page.getByRole('button', { name: 'Load the real example', exact: true });
  if (await load.count()) await load.click();
  await expect(page.locator('[data-atlas-mode]')).toBeVisible();
}

test('connected story follows chapters, inspects saved checks, and compares the correction', async ({ page }) => {
  test.setTimeout(120_000);
  await openMap(page);
  await expect(page.locator('[data-atlas-mode]')).toHaveAttribute('data-atlas-mode', 'scroll');
  const storyBottom = await page.locator('.trace-sticky').evaluate((element) => element.getBoundingClientRect().bottom + scrollY);
  const readableStart = await page.locator('.trace-readable-data').evaluate((element) => element.getBoundingClientRect().top + scrollY);
  expect(readableStart).toBeGreaterThanOrEqual(storyBottom - 1);
  const chapters = page.getByRole('navigation', { name: 'Connected story' });
  await chapters.getByRole('button', { name: /03Check/ }).click();
  await expect(page.getByRole('heading', { name: 'The check found a gap.' })).toBeVisible();
  await expect(page.locator('.trace-test-result')).toContainText('3 failed');
  await page.getByRole('button', { name: 'Supplied correction', exact: true }).click();
  await expect(page.locator('[data-atlas-version]')).toHaveAttribute('data-atlas-version', 'after');
  await expect(page.locator('.trace-test-result')).toContainText('0 failed');
  await page.getByRole('button', { name: 'Source evidence', exact: true }).click();
  await expect(page.locator('.trace-source-list a').first()).toHaveAttribute('href', /^\/evidence\?/);
  await chapters.getByRole('button', { name: /01Describe/ }).click();
  await expect(page.locator('[data-atlas-version]')).toHaveAttribute('data-atlas-version', 'before');
  await expect(page.getByRole('heading', { name: 'Start with the promise.' })).toBeVisible();
  await page.getByRole('button', { name: 'Explore without scrolling' }).click();
  await expect(page.locator('[data-atlas-mode]')).toHaveAttribute('data-atlas-mode', 'explore');
  await expect(page.locator('.trace-readable-story > li')).toHaveCount(5);
});

test('reduced motion and narrow screens retain selectable evidence without pinning the story', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 390, height: 844 });
  await openMap(page);
  await expect(page.locator('[data-atlas-mode]')).toHaveAttribute('data-atlas-mode', 'explore');
  await page.getByRole('button', { name: 'Recorded checks', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'The check found a gap.' })).toBeVisible();
  await expect(page.locator('.trace-readable-story > li')).toHaveCount(5);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('without JavaScript the stored evidence and idea entry remain available', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await openMap(page);
  await expect(page.locator('[data-atlas-mode]')).toHaveAttribute('data-atlas-mode', 'explore');
  await page.getByText('Read the evidence without the map', { exact: true }).click();
  await expect(page.locator('.trace-readable-data')).toContainText('Rules-based findings');
  await expect(page.getByRole('link', { name: 'Open the real example report' })).toBeVisible();
  await page.getByRole('link', { name: 'Start with your idea' }).click();
  await expect(page).toHaveURL(/\/start/);
  await page.getByLabel('What are you building?').fill('A simple meal planner for my family.');
  await expect(page.getByLabel('What are you building?')).toHaveValue('A simple meal planner for my family.');
  await expect(page.getByLabel('Project name', { exact: true })).toBeVisible();
  await context.close();
});
