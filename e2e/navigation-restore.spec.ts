import { expect, test } from '@playwright/test';
import { register, skipToApp } from './support';

test('refresh restores the current primary section from session memory', async ({ page }) => {
  await register(page, `qa-nav-${Date.now()}@example.com`);
  await skipToApp(page);
  await page.getByRole('button', { name: 'Shop' }).first().click();
  await expect(page.getByText(/demonstration|demo/i).first()).toBeVisible();
  await page.reload();
  await expect(page.getByText(/demonstration|demo/i).first()).toBeVisible({ timeout: 20_000 });
  await expect(page.getByRole('button', { name: 'Shop' }).first()).toBeVisible();
});
