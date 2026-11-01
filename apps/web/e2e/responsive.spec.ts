import { test, expect } from '@playwright/test';

// Every public and workspace page must fit the viewport width on phones:
// no horizontal page overflow, whatever the screen size. Components that
// are intentionally wide (data tables) scroll inside their own container.
const routes = ['/', '/features', '/how-it-works', '/demo', '/start', '/connect', '/workspace', '/new', '/runs', '/changes', '/settings', '/quiz'];

test('no page overflows horizontally on phone widths', async ({ page }) => {
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    for (const route of routes) {
      await page.goto(route);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, `${route} at ${width}px overflows by ${overflow}px`).toBeLessThanOrEqual(0);
    }
  }
});

test('evidence map fits a phone: labels readable, controls tappable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const load = page.getByRole('button', { name: 'Load the real example', exact: true });
  if (await load.count()) await load.click();
  await expect(page.locator('.trace-experience')).toBeVisible();
  // The provider label must stay separated, never merged into the mode text.
  await expect(page.locator('.trace-mode-label')).toContainText('Rules-based');
  // The canvas hint must sit fully inside the canvas, clear of the nodes.
  const canvas = await page.locator('.trace-canvas').boundingBox();
  const note = await page.locator('.trace-canvas-note').boundingBox();
  expect(canvas).not.toBeNull();
  expect(note).not.toBeNull();
  expect(note!.x).toBeGreaterThanOrEqual(canvas!.x);
  expect(note!.x + note!.width).toBeLessThanOrEqual(canvas!.x + canvas!.width);
  // Build comparison controls stay finger-sized.
  for (const button of await page.locator('.trace-version-switch button').all()) {
    const box = await button.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.height).toBeGreaterThanOrEqual(40);
  }
});
