import { expect, test } from '@playwright/test';
import { editProfileCard, password, register, signIn, signOut, skipToApp } from './support';

test('profile size, colour, and budget survive refresh and stay on that account', async ({ page }) => {
  const email = `qa-profile-${Date.now()}@example.com`;
  await register(page, email);
  await page.getByRole('button', { name: "Let's Get Started" }).click();
  await page.getByPlaceholder('e.g. Nandi, Thabo, Sarah').fill('Nandi');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'M (SA 34)', exact: true }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Navy Blue' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Under R300' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Explore MyStyle AI' }).click();
  await expect(page.getByRole('button', { name: 'Home' }).first()).toBeVisible();

  await page.getByRole('button', { name: 'My Profile' }).first().click();
  await expect(page.getByRole('heading', { name: 'Nandi' })).toBeVisible();
  await expect(page.getByText('M (SA 34)')).toBeVisible();
  await expect(page.getByText('Navy Blue')).toBeVisible();

  await editProfileCard(page, 'Sizes & Measurements');
  await page.route('**/api/profile', (route) => route.request().method() === 'PUT' ? route.abort() : route.continue());
  await page.locator('label', { hasText: 'Tops Size' }).locator('..').locator('select').selectOption('XL (SA 38)');
  await page.getByRole('button', { name: 'Save Changes' }).click();
  await expect(page.getByRole('alert')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Save Changes' })).toBeVisible();
  await page.unroute('**/api/profile');
  await page.getByRole('button', { name: 'Cancel' }).click();

  await editProfileCard(page, 'Sizes & Measurements');
  await page.locator('label', { hasText: 'Tops Size' }).locator('..').locator('select').selectOption('L (SA 36)');
  await page.getByRole('button', { name: 'Save Changes' }).click();
  await expect(page.getByText('L (SA 36)')).toBeVisible();

  await editProfileCard(page, 'Colour Palette & Fit');
  await page.getByRole('button', { name: 'Soft Gold' }).click();
  await page.getByRole('button', { name: 'Save Changes' }).click();
  await expect(page.getByText('Soft Gold')).toBeVisible();

  await editProfileCard(page, 'Shopping Preferences');
  await page.locator('label', { hasText: 'Target Budget Per Item' }).locator('..').locator('select').selectOption('600-1000');
  await page.getByRole('button', { name: 'Save Changes' }).click();
  await expect(page.getByText('600-1000')).toBeVisible();

  await page.reload();
  await page.getByRole('button', { name: 'My Profile' }).first().click();
  await expect(page.getByRole('heading', { name: 'Nandi' })).toBeVisible();
  await expect(page.getByText('L (SA 36)')).toBeVisible();
  await expect(page.getByText('Soft Gold')).toBeVisible();
  await expect(page.getByText('600-1000')).toBeVisible();

  await signOut(page);
  await signIn(page, email);
  await page.getByRole('button', { name: 'My Profile' }).first().click();
  await expect(page.getByText('L (SA 36)')).toBeVisible();

  await signOut(page);
  await page.getByLabel('Email').fill(`qa-other-${Date.now()}@example.com`);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByLabel('Confirm password').fill(password);
  await page.getByRole('button', { name: 'Create account' }).click();
  await skipToApp(page);
  await page.getByRole('button', { name: 'My Profile' }).first().click();
  await expect(page.getByRole('heading', { name: 'Nandi' })).toHaveCount(0);
  await expect(page.getByText('L (SA 36)')).toHaveCount(0);
  await expect(page.getByText('Soft Gold')).toHaveCount(0);
});
