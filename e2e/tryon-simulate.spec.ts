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

test('local development demo runs a labelled mock without calling FASHN', async ({ page }) => {
  const hosts = watchExternal(page);
  const email = `tryon-e2e-${Date.now()}@example.com`;
  await register(page, email);
  await skipToApp(page);
  await uploadFullBody(page);

  await page.getByRole('button', { name: 'Try On' }).first().click();
  await expect(page.getByRole('heading', { name: 'Virtual Fitting Room' })).toBeVisible();
  await expect(page.getByText(/Local development demonstration mode/i)).toBeVisible();

  const fileInput = page.locator('input[type="file"][accept*="image"]');
  await fileInput.setInputFiles({
    name: 'garment.png',
    mimeType: 'image/png',
    buffer: garmentPng,
  });

  await page.getByRole('button', { name: 'Continue to photograph' }).click();
  await expect(page.getByText(/Full-body photograph ready|Using saved account photograph/i)).toBeVisible();
  await page.getByRole('button', { name: 'Continue to confirm' }).click();

  await expect(page.getByTestId('tryon-confirm')).toBeVisible();
  await expect(page.getByText(/Ready to generate virtual try-on/i)).toBeVisible();
  await expect(page.getByText(/These are your inputs only/i)).toBeVisible();
  await expect(page.getByTestId('tryon-confirm-photo')).toBeVisible();
  await expect(page.getByTestId('tryon-confirm-garment')).toBeVisible();
  await expect(page.getByTestId('tryon-result')).toHaveCount(0);

  await page.getByTestId('tryon-generate').click();

  await expect(page.getByTestId('tryon-result')).toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId('tryon-mock-banner')).toBeVisible();
  await expect(page.getByText(/Demonstration output — not a real virtual try-on/i).first()).toBeVisible();
  const resultImg = page.getByTestId('tryon-result-image');
  await expect(resultImg).toBeVisible();
  const resultSrc = await resultImg.getAttribute('src');
  const resultMediaId = await resultImg.getAttribute('data-result-media-id');
  expect(resultSrc).toContain('/api/media/');
  expect(resultMediaId).toBeTruthy();
  expect(resultSrc).toContain(resultMediaId!);

  await page.reload();
  await page.getByRole('button', { name: 'Try On' }).first().click();
  await page.getByRole('button', { name: 'My Fittings' }).click();
  await expect(page.getByText(/Local demo/i).first()).toBeVisible();
  await page.locator('ul li button').first().click();
  await expect(page.getByTestId('tryon-result-image')).toBeVisible();
  await expect(page.getByTestId('tryon-result-image')).toHaveAttribute('data-result-media-id', resultMediaId!);

  expect(hosts).toEqual([]);
});

test('shop confirm shows inputs only and never treats garment preview as result', async ({ page }) => {
  const email = `tryon-confirm-${Date.now()}@example.com`;
  await register(page, email);
  await skipToApp(page);
  await uploadFullBody(page);

  await page.getByRole('button', { name: 'Shop' }).first().click();
  await page.getByRole('button', { name: /Try It On/i }).first().click({ force: true });
  await expect(page.getByRole('heading', { name: 'Virtual Fitting Room' })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText(/Shop garment preselected|Demonstration catalogue/i).first()).toBeVisible();
  await page.getByRole('button', { name: '2 · Photograph' }).click();
  await expect(page.getByText(/Full-body photograph ready|Using saved account photograph/i)).toBeVisible();
  await page.getByRole('button', { name: '3 · Confirm' }).click();

  await expect(page.getByTestId('tryon-confirm')).toBeVisible();
  await expect(page.getByText(/Ready to generate virtual try-on/i)).toBeVisible();
  await expect(page.getByText(/These are your inputs only/i)).toBeVisible();
  await expect(page.getByTestId('tryon-confirm-photo')).toBeVisible();
  await expect(page.getByTestId('tryon-confirm-garment')).toBeVisible();
  await expect(page.getByRole('button', { name: '4 · Result' })).toBeDisabled();
  await expect(page.getByTestId('tryon-after')).toHaveCount(0);
  await expect(page.getByTestId('tryon-result-image')).toHaveCount(0);
});

test('shop try it on preselects garment and loads saved photograph', async ({ page }) => {
  const email = `tryon-shop-${Date.now()}@example.com`;
  await register(page, email);
  await skipToApp(page);
  await uploadFullBody(page);

  await page.getByRole('button', { name: 'Shop' }).first().click();
  await page.getByRole('button', { name: /Try It On/i }).first().click({ force: true });
  await expect(page.getByRole('heading', { name: 'Virtual Fitting Room' })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText(/Shop garment preselected|Demonstration catalogue/i).first()).toBeVisible();
  await page.getByRole('button', { name: '2 · Photograph' }).click();
  await expect(page.getByText(/Full-body photograph ready|Using saved account photograph/i)).toBeVisible();
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

test('fittings list and delete stay account-private', async ({ page, browser }) => {
  const email = `tryon-fit-${Date.now()}@example.com`;
  await register(page, email);
  await skipToApp(page);
  await uploadFullBody(page);

  await page.getByRole('button', { name: 'Try On' }).first().click();
  const fileInput = page.locator('input[type="file"][accept*="image"]');
  await fileInput.setInputFiles({
    name: 'garment.png',
    mimeType: 'image/png',
    buffer: garmentPng,
  });
  await page.getByRole('button', { name: 'Continue to photograph' }).click();
  await page.getByRole('button', { name: 'Continue to confirm' }).click();
  await page.getByRole('button', { name: 'Run Local Development Demo' }).click();
  await expect(page.getByText(/demonstration/i).first()).toBeVisible({ timeout: 15_000 });

  await page.getByRole('button', { name: 'View previous results' }).click();
  await expect(page.getByRole('heading', { name: 'My Virtual Fittings' })).toBeVisible();
  await expect(page.getByText(/Local demo/i).first()).toBeVisible();

  const fittings = await page.request.get('/api/tryon/fittings');
  expect(fittings.ok()).toBeTruthy();
  const body = await fittings.json() as { fittings: { id: string; resultMediaId: string }[] };
  expect(body.fittings.length).toBeGreaterThan(0);
  const fittingId = body.fittings[0]!.id;
  const resultMediaId = body.fittings[0]!.resultMediaId;

  const other = await browser.newPage();
  const otherEmail = `tryon-other-${Date.now()}@example.com`;
  await register(other, otherEmail);
  await skipToApp(other);
  const stolenJob = await other.request.get(`/api/tryon/jobs/${fittingId}`);
  expect(stolenJob.status()).toBe(404);
  const stolenMedia = await other.request.get(`/api/media/${resultMediaId}`);
  expect(stolenMedia.status()).toBe(404);
  await other.close();

  const token = await csrf(page);
  const deleted = await page.request.delete(`/api/tryon/jobs/${fittingId}`, {
    headers: { 'x-csrf-token': token },
  });
  expect(deleted.ok()).toBeTruthy();
});
