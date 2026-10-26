import { expect, test } from '@playwright/test';
import {
  csrf,
  garmentPng,
  grantPrivatePhotoStorage,
  register,
  skipToApp,
  watchExternal,
} from './support';

async function uploadFullBody(page: import('@playwright/test').Page): Promise<string> {
  await grantPrivatePhotoStorage(page);
  const token = await csrf(page);
  const response = await page.request.put('/api/profile/photos/full_body_front', {
    headers: { 'content-type': 'application/json', 'x-csrf-token': token },
    data: { imageBase64: garmentPng.toString('base64') },
  });
  expect(response.ok()).toBeTruthy();
  const body = await response.json() as { mediaId: string };
  return body.mediaId;
}

test('simulate fit runs a labelled mock demonstration without calling FASHN', async ({ page }) => {
  const hosts = watchExternal(page);
  const email = `tryon-e2e-${Date.now()}@example.com`;
  await register(page, email);
  await skipToApp(page);
  await uploadFullBody(page);

  await page.getByRole('button', { name: 'Try On' }).first().click();
  await expect(page.getByRole('heading', { name: 'Virtual Fitting Room' })).toBeVisible();

  const fileInput = page.locator('input[type="file"][accept*="image"]');
  await fileInput.setInputFiles({
    name: 'garment.png',
    mimeType: 'image/png',
    buffer: garmentPng,
  });

  await page.getByRole('button', { name: 'Simulate Fit' }).click();
  await expect(page.getByText(/Demonstration/i).first()).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText(/not a real virtual try-on|labelled as a demonstration/i).first()).toBeVisible();
  expect(hosts).toEqual([]);
});

test('live FASHN remains blocked without server live flag', async ({ page }) => {
  const email = `tryon-live-${Date.now()}@example.com`;
  await register(page, email);
  await skipToApp(page);
  const personMediaId = await uploadFullBody(page);
  const token = await csrf(page);
  await page.request.post('/api/privacy/consent', {
    headers: { 'content-type': 'application/json', 'x-csrf-token': token },
    data: { purpose: 'external_photo_ai', granted: true, captureMethod: 'settings_toggle' },
  });
  const response = await page.request.post('/api/tryon/jobs', {
    headers: { 'content-type': 'application/json', 'x-csrf-token': token },
    data: {
      personMediaId,
      garmentImageBase64: garmentPng.toString('base64'),
      category: 'tops',
      providerId: 'fashn-tryon-v1.6',
      idempotencyKey: `e2e-live-${Date.now()}`,
    },
  });
  expect(response.status()).toBe(403);
  const body = await response.json() as { code: string };
  expect(body.code).toBe('live_tryon_disabled');
});
