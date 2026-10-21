import { expect, test } from '@playwright/test';
import { password, register, signIn, signOut, skipToApp } from './support';

async function followCaptured(page: import('@playwright/test').Page, kind: string, recipient: string): Promise<void> {
  const listed = await page.request.get('http://127.0.0.1:4341/api/dev/mailbox');
  expect(listed.ok()).toBeTruthy();
  const body = await listed.json() as { messages: { id: string; kind: string; recipient: string }[] };
  const message = body.messages.find((item) => item.kind === kind && item.recipient === recipient);
  expect(message).toBeTruthy();
  const action = await page.request.get(`http://127.0.0.1:4341/api/dev/mailbox/${message!.id}/action`);
  expect(action.ok()).toBeTruthy();
  const path = (await action.json() as { path: string }).path;
  expect(path.includes('token=')).toBeTruthy();
  await page.goto(path);
}

test('email verification and password recovery work through captured local messages', async ({ page }) => {
  const email = `security-${Date.now()}@example.com`;
  await register(page, email);
  await expect(page.getByText(/Confirm/i)).toBeVisible();
  await expect(page.getByText(email).first()).toBeVisible();

  await followCaptured(page, 'email_verification', email);
  await expect(page.getByText(/verified/i).first()).toBeVisible();
  await expect(page.getByRole('button', { name: 'Resend verification' })).toHaveCount(0);

  await skipToApp(page);
  await expect(page.getByRole('button', { name: 'Home' }).first()).toBeVisible();

  await signOut(page);
  await page.getByRole('button', { name: 'I already have an account' }).click();
  await page.getByRole('button', { name: 'Forgot password' }).click();
  await page.getByLabel('Email').fill(email);
  await page.getByRole('button', { name: 'Send reset instructions' }).click();
  await expect(page.getByText(/If an account exists/i)).toBeVisible();

  await followCaptured(page, 'password_reset', email);
  await expect(page.getByRole('heading', { name: 'Choose a new password' })).toBeVisible();
  const nextPassword = 'fresh-correct-99';
  await page.getByLabel('New password').fill(nextPassword);
  await page.getByLabel('Confirm password').fill(nextPassword);
  await page.getByRole('button', { name: 'Save new password' }).click();
  await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();

  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByText(/not accepted|incorrect|could not/i).first()).toBeVisible();

  await signIn(page, email, nextPassword);
  await expect(page.getByRole('button', { name: 'Home' }).first()).toBeVisible({ timeout: 20_000 });
  await page.getByRole('button', { name: 'My Profile' }).first().click();
  await expect(page.getByRole('main').getByText(email)).toBeVisible();

  await page.goto('/?action=verify-email&token=not-a-real-token-value-xxxxxx');
  await expect(page.getByRole('heading', { name: 'Email verification' })).toBeVisible();
});

test('home profile wardrobe and beauty remain reachable after security flows', async ({ page }) => {
  const email = `security-smoke-${Date.now()}@example.com`;
  await register(page, email);
  await skipToApp(page);
  await expect(page.getByRole('button', { name: 'Home' }).first()).toBeVisible();
  await page.getByRole('button', { name: 'My Profile' }).first().click();
  await expect(page.getByRole('main').getByText(email)).toBeVisible();
  await page.getByRole('button', { name: 'Home' }).first().click();
  await page.getByRole('button', { name: /Browse All/ }).click();
  await expect(page.getByRole('button', { name: 'Add Clothing Piece' })).toBeVisible();
  await page.getByRole('button', { name: 'Home' }).first().click();
  await page.getByRole('button', { name: 'Open AI Beauty Studio' }).click();
  await expect(page.getByText('Preview generation is not yet available.')).toBeVisible();
});
