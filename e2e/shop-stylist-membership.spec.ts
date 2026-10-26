import { expect, test } from '@playwright/test';
import { register, skipToApp, watchExternal } from './support';

test('the stylist keeps consent explicit and does not invent a verified product', async ({ page }) => {
  const external = watchExternal(page);
  await register(page, `qa-consent-${Date.now()}@example.com`);
  await skipToApp(page);
  await page.getByRole('button', { name: 'Coordinate Family Outfits' }).click();
  await page.getByRole('button', { name: /Family Profiles/ }).click();
  await page.getByRole('button', { name: 'Add Member' }).click();
  await page.getByRole('button', { name: 'Child / Teen' }).click();
  await page.getByPlaceholder('e.g. David').fill('Alex');
  await page.getByRole('button', { name: 'Add to Family' }).click();
  await page.getByRole('button', { name: 'Home' }).first().click();
  await page.getByRole('button', { name: 'My Stylist' }).first().click();
  await expect(page.getByText('Personalised styling is off, so saved colours, sizes, and budget stay out of the stylist.')).toBeVisible();
  await expect(page.getByText('In Stock', { exact: true })).toHaveCount(0);
  await expect(page.getByText(/^Demo est\. R/).first()).toBeVisible();
  await page.getByPlaceholder('Ask Aria...').fill('What should the family wear to dinner?');
  await page.getByRole('button', { name: 'Send message' }).click();
  await expect(page.getByText(/For a wedding|dinner|navy|breathable|professional|outfit/i).first()).toBeVisible();
  await expect(page.getByText('Alex')).toHaveCount(0);
  await expect(page.locator('main').getByText(/verified retailer|checked stock/i)).toHaveCount(0);
  await page.getByRole('button', { name: 'Allow personalised styling' }).click();
  await expect(page.getByText('Personalised styling is off, so saved colours, sizes, and budget stay out of the stylist.')).toHaveCount(0);
  expect(external).toEqual([]);
});

test('shop filters, product details, and saved products stay labelled as demonstrations', async ({ page }) => {
  await register(page, `qa-shop-detail-${Date.now()}@example.com`);
  await skipToApp(page);
  await page.getByRole('button', { name: 'Shop' }).first().click();
  await expect(page.getByText(/illustrative demonstration mockups/i)).toBeVisible();
  await page.getByRole('button', { name: 'Filters' }).first().click();
  const before = await page.getByText(/items match|item matches/).textContent();
  await page.getByRole('button', { name: 'Dresses', exact: true }).click();
  const after = await page.getByText(/items match|item matches/).textContent();
  expect(after).not.toEqual(before);
  await page.getByRole('button', { name: /Show \d+ Results/ }).click();
  await expect(page.getByText('Demo Listing').first()).toBeVisible();
  await page.getByText('View Details').first().click();
  await expect(page.getByText(/Demo price: R/)).toBeVisible();
  await expect(page.getByText(/in stock|checked stock|verified retailer offer/i)).toHaveCount(0);
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.getByText(/Saved demonstration reference for/i)).toBeVisible();
  await page.getByRole('button', { name: 'Close product details' }).click();
  await page.getByRole('button', { name: /Saved Wishlist/ }).click();
  await expect(page.getByText('Your Saved Products')).toBeVisible();
  await expect(page.getByText(/demonstration catalogue references/i)).toBeVisible();
  await expect(page.getByText('Demo Listing').first()).toBeVisible();
});

test('try-on screen explains demonstration fits and stays offline from FASHN', async ({ page }) => {
  const external = watchExternal(page);
  await register(page, `qa-tryon-${Date.now()}@example.com`);
  await skipToApp(page);
  await page.getByRole('button', { name: 'Try On' }).first().click();
  await expect(page.getByRole('heading', { name: 'Virtual Fitting Room' })).toBeVisible();
  await expect(page.getByText(/Local development demonstration mode|Virtual Try-On is currently unavailable|Select clothing/i).first()).toBeVisible();
  await expect(page.getByText(/completed transformation|fitting result ready/i)).toHaveCount(0);
  expect(external).toEqual([]);
});

test('membership stays a labelled demonstration without a payment success', async ({ page }) => {
  await register(page, `qa-member-${Date.now()}@example.com`);
  await skipToApp(page);
  await page.getByRole('button', { name: 'Explore All Membership Plans' }).click();
  await expect(page.getByText('Account plan: Free')).toBeVisible();
  await expect(page.getByText('Entitlement status: active')).toBeVisible();
  await expect(page.getByText('Test credits: 0')).toBeVisible();
  await expect(page.getByText('Not a paid subscription.')).toBeVisible();
  await expect(page.getByRole('button', { name: /Preview / }).first()).toBeVisible();
  await page.getByRole('button', { name: /Preview / }).first().click();
  await expect(page.getByText(/payment successful|card charged|purchase complete/i)).toHaveCount(0);
  await expect(page.getByText('Account plan: Free')).toBeVisible();
  await page.getByRole('button', { name: 'My Membership' }).click();
  await expect(page.getByText('Transparent Prototype Guarantee')).toBeVisible();
  await expect(page.getByText(/No live credit card charges/i)).toBeVisible();
  await expect(page.getByText(/Account entitlement|Browser demonstration/i).first()).toBeVisible();
  await expect(page.getByRole('button', { name: 'AI Credits', exact: true })).toBeVisible();
  await page.reload();
  await page.getByRole('button', { name: 'Home' }).first().click();
  await page.getByRole('button', { name: 'Explore All Membership Plans' }).click();
  await expect(page.getByText('Account plan: Free')).toBeVisible();
  await expect(page.getByText('Test credits: 0')).toBeVisible();
});

test('membership credits stay on the signed-in account', async ({ page }) => {
  const firstEmail = `qa-credit-a-${Date.now()}@example.com`;
  const secondEmail = `qa-credit-b-${Date.now()}@example.com`;
  await register(page, firstEmail);
  await skipToApp(page);
  const firstSession = await page.request.get('/api/auth/session');
  const firstUser = (await firstSession.json()) as { userId: string };
  await page.request.post('http://127.0.0.1:4341/api/admin/credits/allocate', {
    headers: { authorization: 'Bearer mystyle-e2e-admin-token', 'content-type': 'application/json' },
    data: { userId: firstUser.userId, amount: 3, periodKey: '2026-10', idempotencyKey: `e2e-a-${firstUser.userId}`, reason: 'Browser test allocation' },
  });
  await page.getByRole('button', { name: 'Explore All Membership Plans' }).click();
  await expect(page.getByText('Test credits: 3')).toBeVisible();
  await page.getByRole('button', { name: 'Return to My Profile' }).click();
  await page.getByRole('button', { name: 'Sign out' }).click();
  await register(page, secondEmail);
  await skipToApp(page);
  await page.getByRole('button', { name: 'Explore All Membership Plans' }).click();
  await expect(page.getByText('Account plan: Free')).toBeVisible();
  await expect(page.getByText('Test credits: 0')).toBeVisible();
  const secondSession = await page.request.get('/api/auth/session');
  const secondUser = (await secondSession.json()) as { userId: string };
  const api = 'http://127.0.0.1:4341';
  const headers = { authorization: 'Bearer mystyle-e2e-admin-token', 'content-type': 'application/json' };
  const allocated = await page.request.post(`${api}/api/admin/credits/allocate`, {
    headers,
    data: { userId: secondUser.userId, amount: 6, periodKey: '2026-10', idempotencyKey: `e2e-b-${secondUser.userId}`, reason: 'Browser test allocation' },
  });
  expect(allocated.ok()).toBeTruthy();
  await page.reload();
  await page.getByRole('button', { name: 'Home' }).first().click();
  await page.getByRole('button', { name: 'Explore All Membership Plans' }).click();
  await expect(page.getByText('Test credits: 6')).toBeVisible();
  const reserved = await page.request.post(`${api}/api/admin/credits/reserve`, {
    headers,
    data: { userId: secondUser.userId, amount: 2, idempotencyKey: `e2e-hold-${secondUser.userId}`, operationType: 'text', featureKey: 'account.basic', reason: 'Browser reservation' },
  });
  expect(reserved.ok()).toBeTruthy();
  const reservation = await reserved.json() as { operationId: string; balance: number };
  expect(reservation.balance).toBe(4);
  const settled = await page.request.post(`${api}/api/admin/credits/settle`, {
    headers,
    data: { userId: secondUser.userId, operationId: reservation.operationId, outcome: 'success' },
  });
  expect(settled.ok()).toBeTruthy();
  const failedHold = await page.request.post(`${api}/api/admin/credits/reserve`, {
    headers,
    data: { userId: secondUser.userId, amount: 2, idempotencyKey: `e2e-fail-${secondUser.userId}`, operationType: 'text', featureKey: 'account.basic', reason: 'Browser failure' },
  });
  const failedReservation = await failedHold.json() as { operationId: string };
  const failed = await page.request.post(`${api}/api/admin/credits/settle`, {
    headers,
    data: { userId: secondUser.userId, operationId: failedReservation.operationId, outcome: 'failed' },
  });
  const failure = await failed.json() as { balance: number; status: string };
  expect(failure.status).toBe('released');
  expect(failure.balance).toBe(4);
  await page.reload();
  await page.getByRole('button', { name: 'Home' }).first().click();
  await page.getByRole('button', { name: 'Explore All Membership Plans' }).click();
  await expect(page.getByText('Test credits: 4')).toBeVisible();
  await expect(page.getByText('Account plan: Free')).toBeVisible();
  await expect(page.getByText(/payment successful|card charged/i)).toHaveCount(0);
});
