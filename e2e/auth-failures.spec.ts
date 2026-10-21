import { expect, test } from '@playwright/test';
import { password, register, signIn, signOut, skipToApp } from './support';

test('duplicate registration and a wrong password stay on the sign-in form', async ({ page }) => {
  const email = `qa-auth-${Date.now()}@example.com`;
  await register(page, email);
  await skipToApp(page);
  await signOut(page);

  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByLabel('Confirm password').fill(password);
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page.getByRole('alert')).toContainText('An account with that email already exists.');
  await expect(page.getByRole('heading', { name: 'Create your account' })).toBeVisible();

  await signIn(page, email, 'wrong-password-12');
  await expect(page.getByRole('alert')).toContainText('The email or password was not accepted.');
  await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();

  await signIn(page, email);
  await expect(page.getByRole('button', { name: 'Home' }).first()).toBeVisible();
});

test('a stopped account service and an invalid session are explained', async ({ page }) => {
  const email = `qa-session-${Date.now()}@example.com`;
  await register(page, email);
  await skipToApp(page);
  await page.context().addCookies([{
    name: 'mystyle_session',
    value: 'expired-session',
    url: 'http://127.0.0.1:4173',
  }]);
  await page.getByRole('button', { name: 'My Profile' }).first().click();
  await editAndExpectEnded(page);

  await page.route('**/api/**', (route) => route.abort());
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Account service unavailable' })).toBeVisible();
  await expect(page.getByText(/could not be reached|not running/i)).toBeVisible();
});

async function editAndExpectEnded(page: import('@playwright/test').Page): Promise<void> {
  const { editProfileCard } = await import('./support');
  await editProfileCard(page, 'Sizes & Measurements');
  await page.locator('label', { hasText: 'Tops Size' }).locator('..').locator('select').selectOption('L (SA 36)');
  await page.getByRole('button', { name: 'Save Changes' }).click();
  await expect(page.getByText(/session has ended|Session expired|Sign in is required/i)).toBeVisible();
}

test('onboarding save failure does not enter the app', async ({ page }) => {
  await register(page, `qa-save-${Date.now()}@example.com`);
  await page.getByRole('button', { name: "Let's Get Started" }).click();
  for (let step = 2; step <= 7; step += 1) {
    await expect(page.getByText(`${step} of 8`, { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Skip', exact: true }).click();
  }
  await page.route('**/api/profile', (route) => route.request().method() === 'PUT' ? route.abort() : route.continue());
  await page.getByRole('button', { name: 'Explore MyStyle AI' }).click();
  await expect(page.getByRole('alert')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Home' })).toHaveCount(0);
});
