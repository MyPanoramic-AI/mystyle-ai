import { expect, test } from '@playwright/test';
import { csrf, register, signOut, skipToApp, watchExternal } from './support';

test('discover inspiration can be saved once and then removed', async ({ page }) => {
  await register(page, `qa-discover-${Date.now()}@example.com`);
  await skipToApp(page);
  await page.getByRole('button', { name: 'Discover Styles' }).first().click();
  await expect(page.getByText(/inspiration/i).first()).toBeVisible();
  await expect(page.getByText(/verified retailer|in stock/i)).toHaveCount(0);
  await page.getByText('Modern Office Muse').first().click();
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Saved', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Saved', exact: true }).click();
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await page.getByRole('button', { name: 'Close outfit detail' }).click();
  await page.getByRole('button', { name: 'Saved Looks' }).click();
  await expect(page.getByText('Modern Office Muse')).toHaveCount(1);
  await page.getByRole('button', { name: 'Remove look' }).click();
  await page.reload();
  await page.getByRole('button', { name: 'Home' }).first().click();
  await page.getByRole('button', { name: 'Discover Styles' }).first().click();
  await page.getByRole('button', { name: 'Saved Looks' }).click();
  await expect(page.getByText('Modern Office Muse')).toHaveCount(0);
});

test('beauty looks can be saved, linked to an owned outfit, and deleted', async ({ page }) => {
  const external = watchExternal(page);
  const email = `qa-beauty-${Date.now()}@example.com`;
  await register(page, email);
  await skipToApp(page);
  const token = await csrf(page);
  const created = await page.request.post('/api/looks', {
    headers: { 'x-csrf-token': token },
    data: { title: 'QA linked outfit' },
  });
  expect(created.ok()).toBeTruthy();
  const outfit = await created.json() as { id: string; title: string };

  await page.getByRole('button', { name: 'Open AI Beauty Studio' }).click();
  await expect(page.getByText('Preview generation is not yet available.')).toBeVisible();
  await expect(page.locator('input[type="file"]')).toHaveCount(0);
  for (const tab of ['Hairstyles', 'Hair Colours', 'Makeup & Glow', 'Nail Art']) {
    await page.getByRole('button', { name: tab }).click();
    await page.getByRole('button', { name: 'Save', exact: true }).first().click();
    await expect(page.getByText(/Look saved successfully|already saved/i)).toBeVisible();
  }
  await page.getByRole('button', { name: 'Complete Looks' }).click();
  await page.getByLabel('Look name').fill('QA wedding guest');
  await page.getByRole('button', { name: 'Save look', exact: true }).click();
  await expect(page.getByText('Look saved successfully.')).toBeVisible();
  const savedLook = page.locator('article').filter({ hasText: 'QA wedding guest' });
  await savedLook.getByLabel('Notes').fill('Soft gold accents');
  await savedLook.getByLabel('Notes').blur();
  await expect(page.getByText('Changes saved.')).toBeVisible();
  await savedLook.getByLabel('Link one of your outfits or plans').selectOption({ label: outfit.title });
  await expect(savedLook.getByText('1 outfit link saved')).toBeVisible();

  page.once('dialog', async (dialog) => { await dialog.accept(); });
  await savedLook.getByRole('button', { name: 'Remove', exact: true }).click();
  await page.reload();
  await page.getByRole('button', { name: 'Home' }).first().click();
  await page.getByRole('button', { name: 'Open AI Beauty Studio' }).click();
  await page.getByRole('button', { name: /Saved \(/ }).click();
  await expect(page.getByText('QA wedding guest')).toHaveCount(0);
  expect(external).toEqual([]);

  await signOut(page);
  await page.getByLabel('Email').fill(`qa-beauty-b-${Date.now()}@example.com`);
  await page.getByLabel('Password', { exact: true }).fill('correct-horse-12');
  await page.getByLabel('Confirm password').fill('correct-horse-12');
  await page.getByRole('button', { name: 'Create account' }).click();
  await skipToApp(page);
  const otherToken = await csrf(page);
  const foreign = await page.request.post('/api/beauty-looks/00000000-0000-4000-8000-000000000000/links', {
    headers: { 'x-csrf-token': otherToken },
    data: { outfitId: outfit.id },
  });
  expect(foreign.status()).toBe(404);
  const body = await foreign.text();
  expect(body).not.toContain(outfit.title);
  expect(body).not.toContain(email);
});

test('family profiles and an event stay consistent for one adult account', async ({ page }) => {
  const external = watchExternal(page);
  await register(page, `qa-family-${Date.now()}@example.com`);
  await skipToApp(page);
  await page.getByRole('button', { name: 'Coordinate Family Outfits' }).click();
  await page.getByRole('button', { name: /Family Profiles/ }).click();
  await page.getByRole('button', { name: 'Add Member' }).click();
  await page.getByPlaceholder('e.g. David').fill('Sam');
  await page.getByRole('button', { name: 'Add to Family' }).click();
  await expect(page.getByText('Family profile saved.')).toBeVisible();

  await page.getByRole('button', { name: 'Edit Profile' }).click();
  await page.getByPlaceholder('e.g. David').fill('Samira');
  await page.getByRole('button', { name: 'Save Changes' }).click();
  await expect(page.getByText('Samira')).toBeVisible();

  await page.getByRole('button', { name: 'Add Member' }).click();
  await page.getByRole('button', { name: 'Child / Teen' }).click();
  await expect(page.locator('input[type="file"]')).toHaveCount(0);
  await page.getByPlaceholder('e.g. David').fill('Alex');
  await page.getByRole('button', { name: 'Add to Family' }).click();
  await expect(page.getByText('Alex')).toBeVisible();

  await page.getByRole('button', { name: 'Occasion Planner' }).click();
  await page.getByText('Samira', { exact: true }).first().click();
  await page.getByText('Navy, Crisp White & Camel').click();
  await page.getByRole('button', { name: 'R7,500' }).click();
  await page.getByRole('button', { name: 'Save Plan' }).click();
  await expect(page.getByText('Event plan saved.')).toBeVisible();
  await page.reload();
  await page.getByRole('button', { name: 'Home' }).first().click();
  await page.getByRole('button', { name: 'Coordinate Family Outfits' }).click();
  await page.getByRole('button', { name: 'Occasion Planner' }).click();
  await expect(page.getByText(/Navy, Crisp White & Camel/)).toBeVisible();

  await page.getByRole('button', { name: /Family Profiles/ }).click();
  page.once('dialog', async (dialog) => { await dialog.accept(); });
  await page.getByRole('button', { name: 'Remove Family Member' }).first().click();
  await expect(page.getByRole('heading', { name: 'Samira' })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Alex' })).toBeVisible();
  await page.getByRole('button', { name: 'Occasion Planner' }).click();
  await expect(page.getByRole('heading', { name: /Occasion|Family/ }).first()).toBeVisible();
  expect(external).toEqual([]);
});
