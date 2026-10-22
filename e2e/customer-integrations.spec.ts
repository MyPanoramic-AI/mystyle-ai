import { expect, test } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { csrf, password, register, signIn, signOut, skipToApp } from './support';

const fixtureJpeg = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures', 'portrait.jpg');

test('onboarding photographs, wishlist, and membership stay account-scoped', async ({ page }) => {
  const email = `qa-integrations-${Date.now()}@example.com`;
  const other = `qa-integrations-b-${Date.now()}@example.com`;
  await register(page, email);
  await page.getByRole('button', { name: "Let's Get Started" }).click();
  for (let step = 2; step <= 6; step += 1) {
    await expect(page.getByText(`${step} of 8`, { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Skip', exact: true }).click();
  }
  await expect(page.getByText('7 of 8', { exact: true })).toBeVisible();
  await page.getByLabel('Consent to private photograph storage').check();
  await page.locator('input[type="file"]').nth(0).setInputFiles(fixtureJpeg);
  await expect(page.getByText('Saved privately to your account').first()).toBeVisible({ timeout: 20_000 });
  await page.locator('input[type="file"]').nth(1).setInputFiles(fixtureJpeg);
  await expect(page.getByText('Saved privately to your account')).toHaveCount(2, { timeout: 20_000 });
  await page.locator('input[type="file"]').nth(2).setInputFiles(fixtureJpeg);
  await expect(page.getByText('Saved privately to your account')).toHaveCount(3, { timeout: 20_000 });
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Explore MyStyle AI' }).click();
  await expect(page.getByRole('button', { name: 'Home' }).first()).toBeVisible();

  await page.reload();
  const token = await csrf(page);
  const photos = await page.request.get('/api/profile/photos');
  expect(photos.ok()).toBeTruthy();
  const slots = await photos.json() as {
    photos: { portraitMediaId: string | null; fullBodyFrontMediaId: string | null; fullBodyAdditionalMediaId: string | null };
  };
  expect(slots.photos.portraitMediaId).toBeTruthy();
  expect(slots.photos.fullBodyFrontMediaId).toBeTruthy();
  expect(slots.photos.fullBodyAdditionalMediaId).toBeTruthy();

  const replaced = await page.request.put('/api/profile/photos/portrait', {
    headers: { 'x-csrf-token': token, 'content-type': 'application/json' },
    data: { imageBase64: Buffer.from([0xff, 0xd8, 0xff, 0xd9]).toString('base64') },
  });
  expect(replaced.ok()).toBeTruthy();
  const deleted = await page.request.delete('/api/profile/photos/full_body_additional', {
    headers: { 'x-csrf-token': token },
  });
  expect(deleted.ok()).toBeTruthy();

  const saved = await page.request.post('/api/saved-products', {
    headers: { 'x-csrf-token': token, 'content-type': 'application/json' },
    data: { retailerSource: 'mystyle_demo_catalogue', externalProductId: 'prod-cream-sculptural-blazer' },
  });
  expect(saved.ok()).toBeTruthy();
  const duplicate = await page.request.post('/api/saved-products', {
    headers: { 'x-csrf-token': token, 'content-type': 'application/json' },
    data: { retailerSource: 'mystyle_demo_catalogue', externalProductId: 'prod-cream-sculptural-blazer' },
  });
  expect((await duplicate.json() as { duplicate?: boolean }).duplicate).toBe(true);

  await page.getByRole('button', { name: 'Home' }).first().click();
  await page.getByRole('button', { name: 'Shop' }).first().click();
  await expect(page.getByText(/illustrative demonstration mockups/i)).toBeVisible();
  await page.getByRole('button', { name: /Saved Wishlist/i }).click();
  await expect(page.getByText(/demonstration catalogue references/i)).toBeVisible();
  await expect(page.getByText(/Sculptural Double-Breasted/i)).toBeVisible();

  await page.getByRole('button', { name: 'Home' }).first().click();
  await page.getByRole('button', { name: 'Explore All Membership Plans' }).click();
  await expect(page.getByText('Account plan: Free')).toBeVisible();
  await expect(page.getByText('Test credits: 0')).toBeVisible();
  await page.getByRole('button', { name: 'Explore Plans' }).click();
  await page.getByRole('button', { name: /Preview / }).first().click();
  await expect(page.getByText(/Preview only|No payment/i).first()).toBeVisible();
  await expect(page.getByText('Account plan: Free')).toBeVisible();

  await signOut(page);
  await register(page, other);
  await skipToApp(page);
  const otherPhotos = await page.request.get('/api/profile/photos');
  expect((await otherPhotos.json() as { photos: { portraitMediaId: string | null } }).photos.portraitMediaId).toBeNull();
  const otherWish = await page.request.get('/api/saved-products');
  expect((await otherWish.json() as { products: unknown[] }).products).toHaveLength(0);
  await page.getByRole('button', { name: 'Explore All Membership Plans' }).click();
  await expect(page.getByText('Account plan: Free')).toBeVisible();

  await signOut(page);
  await signIn(page, email, password);
  await expect(page.getByRole('button', { name: 'Home' }).first()).toBeVisible();
  const restored = await page.request.get('/api/profile/photos');
  const restoredSlots = await restored.json() as { photos: { portraitMediaId: string | null; fullBodyAdditionalMediaId: string | null } };
  expect(restoredSlots.photos.portraitMediaId).toBeTruthy();
  expect(restoredSlots.photos.fullBodyAdditionalMediaId).toBeNull();
  const wish = await page.request.get('/api/saved-products');
  expect((await wish.json() as { products: unknown[] }).products).toHaveLength(1);
});
