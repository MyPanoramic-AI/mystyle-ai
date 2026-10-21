import { expect, type Page } from '@playwright/test';

export const password = 'correct-horse-12';

export const garmentPng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);

export async function register(page: Page, email: string): Promise<void> {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Create your account' })).toBeVisible();
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByLabel('Confirm password').fill(password);
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page.getByRole('heading', { name: "Let's discover your style." })).toBeVisible();
}

export async function skipToApp(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Skip to App' }).click();
  await expect(page.getByRole('button', { name: 'Home' }).first()).toBeVisible();
}

export async function signOut(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'My Profile' }).first().click();
  await page.getByRole('button', { name: 'Sign out' }).click();
  await expect(page.getByRole('heading', { name: 'Create your account' })).toBeVisible();
}

export async function signIn(page: Page, email: string, secret = password): Promise<void> {
  if (await page.getByRole('heading', { name: 'Create your account' }).isVisible()) {
    await page.getByRole('button', { name: 'I already have an account' }).click();
  }
  await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(secret);
  await page.getByRole('button', { name: 'Sign in' }).click();
}

export function watchExternal(page: Page): string[] {
  const hosts: string[] = [];
  page.on('request', (request) => {
    const host = new URL(request.url()).host;
    if (/api\.openai\.com|generativelanguage\.googleapis\.com|fashn\.ai/i.test(host)) hosts.push(host);
  });
  return hosts;
}

export async function csrf(page: Page): Promise<string> {
  const response = await page.request.get('/api/auth/session');
  expect(response.ok()).toBeTruthy();
  const body = await response.json() as { csrfToken: string };
  return body.csrfToken;
}

export async function editProfileCard(page: Page, heading: string): Promise<void> {
  const card = page.locator('div').filter({
    has: page.getByRole('heading', { name: heading, exact: true }),
  }).filter({
    has: page.getByRole('button', { name: 'Edit' }),
  }).last();
  await card.getByRole('button', { name: 'Edit' }).click();
}
