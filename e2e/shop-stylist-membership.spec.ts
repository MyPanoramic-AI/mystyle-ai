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
  await expect(page.getByText(/Saved ".*" to your wishlist/)).toBeVisible();
  await page.getByRole('button', { name: 'Close product details' }).click();
  await page.getByRole('button', { name: /Saved Wishlist/ }).click();
  await expect(page.getByText('Your Saved Products')).toBeVisible();
  await expect(page.getByText('Demo Listing').first()).toBeVisible();
});

test('try-on controls explain that generation is inactive', async ({ page }) => {
  const external = watchExternal(page);
  await register(page, `qa-tryon-${Date.now()}@example.com`);
  await skipToApp(page);
  await page.getByRole('button', { name: 'Try On' }).first().click();
  await expect(page.getByText('Real try-on generation is not active')).toBeVisible();
  page.once('dialog', async (dialog) => {
    expect(dialog.message()).toContain('Phase 2');
    await dialog.accept();
  });
  await page.getByRole('button', { name: 'Take Photo' }).click();
  page.once('dialog', async (dialog) => {
    expect(dialog.message()).toContain('Phase 2');
    await dialog.accept();
  });
  await page.getByRole('button', { name: 'Choose from Gallery' }).click();
  await expect(page.getByText(/completed transformation|fitting result ready/i)).toHaveCount(0);
  expect(external).toEqual([]);
});

test('membership stays a labelled demonstration without a payment success', async ({ page }) => {
  await register(page, `qa-member-${Date.now()}@example.com`);
  await skipToApp(page);
  await page.getByRole('button', { name: 'Explore All Membership Plans' }).click();
  await expect(page.getByRole('button', { name: /Select / }).first()).toBeVisible();
  await expect(page.getByText(/payment successful|card charged|purchase complete/i)).toHaveCount(0);
  await page.getByRole('button', { name: 'My Membership' }).click();
  await expect(page.getByText('Transparent Prototype Guarantee')).toBeVisible();
  await expect(page.getByText(/No live credit card charges/i)).toBeVisible();
  await expect(page.getByRole('button', { name: 'AI Credits', exact: true })).toBeVisible();
});
