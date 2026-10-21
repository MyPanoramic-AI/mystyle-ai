import { expect, test } from '@playwright/test';
import { garmentPng, register, skipToApp } from './support';

test('a wardrobe piece can be uploaded, edited, planned, and deleted', async ({ page }) => {
  await register(page, `qa-wardrobe-${Date.now()}@example.com`);
  await skipToApp(page);
  await page.getByRole('button', { name: /Browse All/ }).click();
  await page.getByRole('button', { name: 'Add Clothing Piece' }).click();
  await page.locator('input[type="file"]').setInputFiles({
    name: 'qa-shirt.png',
    mimeType: 'image/png',
    buffer: garmentPng,
  });
  await page.getByPlaceholder('e.g. Silk Satin Camisole, Belted Trench Coat').fill('QA linen shirt');
  await page.getByRole('button', { name: 'Save Piece to Wardrobe' }).click();
  await expect(page.getByText('Added "QA linen shirt" to your Digital Wardrobe')).toBeVisible();

  await page.getByRole('heading', { name: 'QA linen shirt' }).click();
  await page.getByRole('button', { name: 'Edit piece' }).click();
  await page.getByPlaceholder('e.g. Silk Satin Camisole, Belted Trench Coat').fill('QA edited shirt');
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.getByText('Saved changes to "QA edited shirt"')).toBeVisible();

  await page.getByRole('button', { name: 'Outfit Studio' }).click();
  await page.getByText('Choose Top').click();
  await page.getByText('QA edited shirt').last().click();
  await page.getByPlaceholder('Name your outfit...').fill('QA office outfit');
  await page.getByRole('button', { name: 'Save Assembled Look to Outfits' }).click();
  await expect(page.getByText('Outfit saved successfully: "QA office outfit"')).toBeVisible();

  await page.getByRole('button', { name: /Saved Looks \(/ }).click();
  page.once('dialog', async (dialog) => { await dialog.accept('QA renamed outfit'); });
  await page.getByRole('button', { name: 'Rename' }).click();
  await expect(page.getByText('QA renamed outfit')).toBeVisible();

  await page.getByRole('button', { name: /Event Planner \(/ }).click();
  await expect(page.getByRole('button', { name: /reschedule/i })).toHaveCount(0);
  await page.getByRole('button', { name: 'Plan New Occasion' }).click();
  await page.getByPlaceholder('e.g. Kirstenbosch Sunset Concert, Wine Farm Wedding').fill('QA gallery visit');
  await page.getByPlaceholder('e.g. Sat, 15 Nov').fill('Sat, 21 Oct');
  await page.getByRole('button', { name: 'Add Event to Planner' }).click();
  await expect(page.getByText('Added event "QA gallery visit" to planner')).toBeVisible();
  await page.getByRole('button', { name: 'Assign From Outfits' }).click();
  await page.getByText('QA renamed outfit').last().click();
  await expect(page.getByText('QA renamed outfit').first()).toBeVisible();

  page.once('dialog', async (dialog) => { await dialog.accept(); });
  await page.getByRole('button', { name: 'Remove', exact: true }).click();
  await expect(page.getByText('No outfits are planned yet.')).toBeVisible();

  await page.getByRole('button', { name: 'Plan New Occasion' }).click();
  await page.getByPlaceholder('e.g. Kirstenbosch Sunset Concert, Wine Farm Wedding').fill('QA gallery visit');
  await page.getByPlaceholder('e.g. Sat, 15 Nov').fill('Sat, 28 Oct');
  await page.getByRole('button', { name: 'Add Event to Planner' }).click();
  await expect(page.getByText('Sat, 28 Oct')).toBeVisible();
  page.once('dialog', async (dialog) => { await dialog.accept(); });
  await page.getByRole('button', { name: 'Remove', exact: true }).click();

  await page.getByRole('button', { name: /Wardrobe \(/ }).click();
  await page.getByText('QA edited shirt').first().click();
  page.once('dialog', async (dialog) => { await dialog.accept(); });
  await page.getByRole('button', { name: 'Remove Piece' }).click();
  await expect(page.getByText('QA edited shirt')).toHaveCount(0);

  await page.getByRole('button', { name: /Saved Looks \(/ }).click();
  await expect(page.getByText('QA renamed outfit')).toBeVisible();
  page.once('dialog', async (dialog) => { await dialog.accept(); });
  await page.getByRole('button', { name: 'Remove', exact: true }).click();
  await expect(page.getByText('Outfit removed')).toBeVisible();

  await page.reload();
  await page.getByRole('button', { name: 'Home' }).first().click();
  await page.getByRole('button', { name: /Browse All/ }).click();
  await expect(page.getByText('QA edited shirt')).toHaveCount(0);
  await page.getByRole('button', { name: /Saved Looks \(/ }).click();
  await expect(page.getByText('QA renamed outfit')).toHaveCount(0);
});
