import { expect, test } from '@playwright/test';
import { password, register, skipToApp } from './support';

const png = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);

test('account consent, export, and deletion stay owner-scoped', async ({ page }) => {
  const email = `qa-privacy-${Date.now()}@example.com`;
  const otherEmail = `qa-privacy-other-${Date.now()}@example.com`;
  await register(page, email);
  await skipToApp(page);

  const session = await page.request.get('/api/auth/session');
  const { csrfToken } = await session.json() as { csrfToken: string; userId: string };
  await page.request.put('/api/profile', {
    headers: { 'x-csrf-token': csrfToken, 'content-type': 'application/json' },
    data: { displayName: 'Privacy Adult', styles: ['classic'], sizes: { tops: 'M' }, budgetTier: 'flexible' },
  });
  const storageConsent = await page.request.post('/api/privacy/consent', {
    headers: { 'x-csrf-token': csrfToken, 'content-type': 'application/json' },
    data: { purpose: 'private_photo_storage', granted: true, captureMethod: 'settings_toggle' },
  });
  expect(storageConsent.ok()).toBeTruthy();
  const uploaded = await page.request.post('/api/media', {
    headers: { 'x-csrf-token': csrfToken, 'content-type': 'application/json' },
    data: { purpose: 'wardrobe', imageBase64: png.toString('base64') },
  });
  expect(uploaded.ok()).toBeTruthy();

  const granted = await page.request.post('/api/privacy/consent', {
    headers: { 'x-csrf-token': csrfToken, 'content-type': 'application/json' },
    data: { purpose: 'ai_personalisation', granted: true, captureMethod: 'settings_toggle' },
  });
  expect(granted.ok()).toBeTruthy();
  const withdrawn = await page.request.post('/api/privacy/consent', {
    headers: { 'x-csrf-token': csrfToken, 'content-type': 'application/json' },
    data: { purpose: 'ai_personalisation', granted: false, captureMethod: 'settings_toggle' },
  });
  const consentBody = await withdrawn.json() as { current: { purpose: string; granted: boolean }[]; history: unknown[] };
  expect(consentBody.current.find((row) => row.purpose === 'ai_personalisation')?.granted).toBe(false);
  expect(consentBody.history.length).toBeGreaterThanOrEqual(6);

  await page.getByRole('button', { name: 'Explore All Membership Plans' }).click();
  await page.getByRole('button', { name: 'Privacy & Data', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Privacy & Data Protection' })).toBeVisible();
  await expect(page.getByText(/External AI image processing is not active/i)).toBeVisible();
  await expect(page.getByText(/wardrobe ·/i)).toBeVisible();
  await page.getByRole('button', { name: 'Delete photograph' }).click();
  await expect(page.getByText(/No private photographs are stored/i)).toBeVisible();

  await page.getByLabel('Confirm password for privacy actions').fill(password);
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Request account export' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/mystyle-account-export-/);

  await page.getByRole('button', { name: 'Begin account deletion' }).click();
  await expect(page.getByRole('button', { name: 'Cancel deletion' })).toBeVisible();
  await page.getByRole('button', { name: 'Cancel deletion' }).click();
  await expect(page.getByText(/Deletion was cancelled/i)).toBeVisible();

  await page.getByRole('button', { name: 'Begin account deletion' }).click();
  await page.getByLabel('Confirm password for privacy actions').fill('wrong-password-xx');
  await page.getByRole('button', { name: 'Confirm deletion' }).click();
  await expect(page.getByText(/password was not accepted|Confirm with your current password|not accepted/i)).toBeVisible();

  await page.getByLabel('Confirm password for privacy actions').fill(password);
  await page.getByRole('button', { name: 'Confirm deletion' }).click();
  await expect(page.getByRole('heading', { name: 'Create your account' })).toBeVisible({ timeout: 20_000 });

  await page.getByRole('button', { name: 'I already have an account' }).click();
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByText(/email or password was not accepted|not accepted/i)).toBeVisible();

  await register(page, otherEmail);
  await skipToApp(page);
  await page.getByRole('button', { name: 'Explore All Membership Plans' }).click();
  await page.getByRole('button', { name: 'Privacy & Data', exact: true }).click();
  await expect(page.getByText(/Signed-in account controls/i)).toBeVisible();
});
