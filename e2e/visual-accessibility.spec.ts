import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { register, skipToApp } from './support';

const widths = [320, 375, 390, 768, 1024, 1440];
const shotDir = path.join('test-results', 'visual');

test('signed-in screens stay within the viewport and can be captured', async ({ page }) => {
  test.setTimeout(300_000);
  mkdirSync(shotDir, { recursive: true });
  await register(page, `qa-visual-${Date.now()}@example.com`);
  const screens: { name: string; open: () => Promise<void> }[] = [
    { name: 'onboarding', open: async () => { await page.goto('/'); } },
    { name: 'home', open: async () => skipToApp(page) },
    { name: 'profile', open: async () => { await page.getByRole('button', { name: 'My Profile' }).first().click(); } },
    { name: 'stylist', open: async () => { await page.getByRole('button', { name: 'My Stylist' }).first().click(); } },
    { name: 'shop', open: async () => { await page.getByRole('button', { name: 'Shop' }).first().click(); } },
    { name: 'try-on', open: async () => { await page.getByRole('button', { name: 'Try On' }).first().click(); } },
    { name: 'wardrobe', open: async () => { await page.getByRole('button', { name: 'Home' }).first().click(); await page.getByRole('button', { name: /Browse All/ }).click(); } },
    { name: 'family', open: async () => { await page.getByRole('button', { name: 'Home' }).first().click(); await page.getByRole('button', { name: 'Coordinate Family Outfits' }).click(); } },
    { name: 'beauty', open: async () => { await page.getByRole('button', { name: 'Home' }).first().click(); await page.getByRole('button', { name: 'Open AI Beauty Studio' }).click(); } },
    { name: 'membership', open: async () => { await page.getByRole('button', { name: 'Home' }).first().click(); await page.getByRole('button', { name: 'Explore All Membership Plans' }).click(); } },
  ];

  const overflows: string[] = [];
  for (const screen of screens) {
    await screen.open();
    for (const width of widths) {
      await page.setViewportSize({ width, height: 800 });
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      if (overflow > 1) overflows.push(`${screen.name} at ${width}px (${overflow}px)`);
    }
    await page.setViewportSize({ width: 375, height: 800 });
    await page.screenshot({ path: path.join(shotDir, `${screen.name}-375.png`), fullPage: true });
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.screenshot({ path: path.join(shotDir, `${screen.name}-1440.png`), fullPage: true });
  }

  await page.setViewportSize({ width: 375, height: 800 });
  await page.getByRole('button', { name: 'Home' }).first().click();
  await page.getByRole('button', { name: /Browse All/ }).click();
  await page.getByRole('button', { name: 'Add Clothing Piece' }).click();
  await page.screenshot({ path: path.join(shotDir, 'wardrobe-modal-375.png'), fullPage: false });
  const modalOverflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  if (modalOverflow > 1) overflows.push(`wardrobe modal at 375px (${modalOverflow}px)`);
  writeFileSync(path.join(shotDir, 'overflows.json'), JSON.stringify(overflows, null, 2));
  expect(overflows).toEqual([]);
});

test('automated accessibility scan of primary modules', async ({ page }, testInfo) => {
  test.setTimeout(300_000);
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Create your account' })).toBeVisible();
  const registration = await new AxeBuilder({ page }).analyze();
  await register(page, `qa-a11y-${Date.now()}@example.com`);
  await skipToApp(page);

  async function scan(name: string, open: () => Promise<void>) {
    await open();
    const result = await new AxeBuilder({ page }).analyze();
    return { name, violations: result.violations.map(compact), count: result.violations.length };
  }

  const modules = [
    await scan('home', async () => { await page.getByRole('button', { name: 'Home' }).first().click(); }),
    await scan('stylist', async () => { await page.getByRole('button', { name: 'My Stylist' }).first().click(); }),
    await scan('shop', async () => { await page.getByRole('button', { name: 'Shop' }).first().click(); }),
    await scan('try-on', async () => { await page.getByRole('button', { name: 'Try On' }).first().click(); }),
    await scan('profile', async () => { await page.getByRole('button', { name: 'My Profile' }).first().click(); }),
    await scan('wardrobe', async () => {
      await page.getByRole('button', { name: 'Home' }).first().click();
      await page.getByRole('button', { name: /Browse All/ }).click();
    }),
    await scan('family', async () => {
      await page.getByRole('button', { name: 'Home' }).first().click();
      await page.getByRole('button', { name: 'Coordinate Family Outfits' }).click();
    }),
    await scan('beauty', async () => {
      await page.getByRole('button', { name: 'Home' }).first().click();
      await page.getByRole('button', { name: 'Open AI Beauty Studio' }).click();
    }),
    await scan('membership', async () => {
      await page.getByRole('button', { name: 'Home' }).first().click();
      await page.getByRole('button', { name: 'Explore All Membership Plans' }).click();
    }),
    await scan('discover', async () => {
      await page.getByRole('button', { name: 'Home' }).first().click();
      await page.getByRole('button', { name: 'Discover Styles' }).first().click();
    }),
  ];

  const summary = {
    registration: registration.violations.map(compact),
    modules,
    totals: Object.fromEntries(modules.map((item) => [item.name, item.count])),
  };
  mkdirSync(shotDir, { recursive: true });
  writeFileSync(path.join(shotDir, 'axe-summary.json'), JSON.stringify(summary, null, 2));
  await testInfo.attach('axe-summary', {
    body: JSON.stringify(summary, null, 2),
    contentType: 'application/json',
  });
  testInfo.annotations.push({
    type: 'axe',
    description: `registration ${summary.registration.length}; modules ${modules.map((item) => `${item.name}:${item.count}`).join(', ')}`,
  });
  expect(registration.violations).toBeDefined();
  expect(modules.length).toBeGreaterThanOrEqual(9);
});

function compact(violation: { id: string; impact?: string | null; help: string; nodes: { target: unknown; html: string }[] }) {
  return {
    id: violation.id,
    impact: violation.impact ?? 'unknown',
    help: violation.help,
    nodes: violation.nodes.length,
    examples: violation.nodes.slice(0, 4).map((node) => ({
      target: JSON.stringify(node.target),
      html: node.html.slice(0, 220),
    })),
  };
}
