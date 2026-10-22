import { expect, test } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { csrf, password, register, signIn, signOut, skipToApp } from './support';

const fixtureJpeg = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures', 'portrait.jpg');

async function openManagePhotos(page: import('@playwright/test').Page): Promise<void> {
  await page.getByRole('button', { name: 'My Profile' }).first().click();
  await page.getByRole('button', { name: 'Manage Photos' }).click();
  await expect(page.getByRole('heading', { name: 'Manage Styling Photographs' })).toBeVisible();
}

test('profile Manage Photos uploads, replaces, deletes, and stays private', async ({ page }) => {
  const email = `qa-manage-photos-${Date.now()}@example.com`;
  const other = `qa-manage-photos-b-${Date.now()}@example.com`;
  await register(page, email);
  await skipToApp(page);

  await openManagePhotos(page);
  await page.getByLabel('Consent to private photograph storage').check();
  await page.getByLabel('Choose 1. Profile Portrait').setInputFiles(fixtureJpeg);
  await expect(page.getByText('Saved privately to your account').first()).toBeVisible({ timeout: 20_000 });
  await page.getByLabel('Choose 2. Full-Body Front Pose').setInputFiles(fixtureJpeg);
  await expect(page.getByText('Saved privately to your account')).toHaveCount(2, { timeout: 20_000 });
  await page.getByLabel('Choose 3. Side or 45° Angle (Optional)').setInputFiles(fixtureJpeg);
  await expect(page.getByText('Saved privately to your account')).toHaveCount(3, { timeout: 20_000 });
  await page.getByRole('button', { name: 'Done' }).click();

  await expect(page.getByText('Private styling photographs on this account')).toBeVisible();

  await page.reload();
  await page.getByRole('button', { name: 'My Profile' }).first().click();
  await expect(page.getByText('Private styling photographs on this account')).toBeVisible();
  const afterReload = await page.request.get('/api/profile/photos');
  expect(afterReload.ok()).toBeTruthy();
  const slots = await afterReload.json() as {
    photos: { portraitMediaId: string | null; fullBodyFrontMediaId: string | null; fullBodyAdditionalMediaId: string | null };
  };
  expect(slots.photos.portraitMediaId).toBeTruthy();
  expect(slots.photos.fullBodyFrontMediaId).toBeTruthy();
  expect(slots.photos.fullBodyAdditionalMediaId).toBeTruthy();
  const portraitId = slots.photos.portraitMediaId!;

  await openManagePhotos(page);
  await page.getByLabel('Choose 1. Profile Portrait').setInputFiles(fixtureJpeg);
  await expect(page.getByText('Saved privately to your account').first()).toBeVisible({ timeout: 20_000 });
  await page.getByRole('button', { name: 'Remove 3. Side or 45° Angle (Optional)' }).click();
  await expect(page.getByRole('button', { name: 'Choose' }).last()).toBeVisible({ timeout: 20_000 });
  await page.getByRole('button', { name: 'Done' }).click();

  const afterEdit = await page.request.get('/api/profile/photos');
  const edited = await afterEdit.json() as {
    photos: { portraitMediaId: string | null; fullBodyAdditionalMediaId: string | null };
  };
  expect(edited.photos.portraitMediaId).toBeTruthy();
  expect(edited.photos.portraitMediaId).not.toBe(portraitId);
  expect(edited.photos.fullBodyAdditionalMediaId).toBeNull();

  const token = await csrf(page);
  const exportJob = await page.request.post('/api/privacy/export', {
    headers: { 'x-csrf-token': token, 'content-type': 'application/json' },
    data: { password },
  });
  expect(exportJob.ok()).toBeTruthy();
  const exportBody = await exportJob.json() as { exportId: string };
  const download = await page.request.get(`/api/privacy/export/${exportBody.exportId}/download`);
  expect(download.ok()).toBeTruthy();
  const zipBytes = Buffer.from(await download.body());
  expect(zipBytes.length).toBeGreaterThan(100);

  await signOut(page);
  await register(page, other);
  await skipToApp(page);
  const foreign = await page.request.get(`/api/media/${edited.photos.portraitMediaId}`);
  expect(foreign.status()).toBe(404);
  const otherSlots = await page.request.get('/api/profile/photos');
  const otherBody = await otherSlots.json() as {
    photos: { portraitMediaId: string | null };
  };
  expect(otherBody.photos.portraitMediaId).toBeNull();

  await signOut(page);
  await signIn(page, email);
  await expect(page.getByRole('button', { name: 'Home' }).first()).toBeVisible();
  await page.getByRole('button', { name: 'My Profile' }).first().click();
  await expect(page.getByText('Private styling photographs on this account')).toBeVisible();
  const restored = await page.request.get('/api/profile/photos');
  const restoredBody = await restored.json() as {
    photos: { portraitMediaId: string | null; fullBodyFrontMediaId: string | null; fullBodyAdditionalMediaId: string | null };
  };
  expect(restoredBody.photos.portraitMediaId).toBe(edited.photos.portraitMediaId);
  expect(restoredBody.photos.fullBodyFrontMediaId).toBeTruthy();
  expect(restoredBody.photos.fullBodyAdditionalMediaId).toBeNull();
});
