import { expect, test, type Page } from '@playwright/test';

const password = 'correct-horse-12';

async function register(page: Page, email: string): Promise<void> {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Create your account' })).toBeVisible();
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByLabel('Confirm password').fill(password);
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page.getByRole('heading', { name: "Let's discover your style." })).toBeVisible();
}

async function skipToApp(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Skip to App' }).click();
  await expect(page.getByRole('button', { name: 'Home' }).first()).toBeVisible();
}

test('registration, refresh, logout, and login keep the same adult account', async ({ page }) => {
  const email = `qa-login-${Date.now()}@example.com`;
  await register(page, email);
  await page.reload();
  await expect(page.getByRole('heading', { name: "Let's discover your style." })).toBeVisible();
  await skipToApp(page);
  await page.getByRole('button', { name: 'My Profile' }).first().click();
  await page.getByRole('button', { name: 'Sign out' }).click();
  await expect(page.getByRole('heading', { name: 'Create your account' })).toBeVisible();
  await page.getByRole('button', { name: 'I already have an account' }).click();
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByRole('button', { name: 'Home' }).first()).toBeVisible();
  await expect(page.getByText('Chloe')).toHaveCount(0);
  await expect(page.getByText('Liam')).toHaveCount(0);
});

test('invalid registration stays on the form', async ({ page }) => {
  await page.goto('/');
  const email = page.getByLabel('Email');
  await email.fill('not-an-email');
  await page.getByLabel('Password', { exact: true }).fill('short');
  await page.getByLabel('Confirm password').fill('short');
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page.getByRole('heading', { name: 'Create your account' })).toBeVisible();
  const nativeMessage = await email.evaluate((input) => (input as HTMLInputElement).validationMessage);
  expect(nativeMessage.length).toBeGreaterThan(0);
  await email.fill(`qa-weak-${Date.now()}@example.com`);
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page.getByRole('alert')).toContainText('Use a password of at least 12 characters.');
});

test('onboarding can be walked and then skipped without importing demonstration family names', async ({ page }) => {
  await register(page, `qa-onboard-${Date.now()}@example.com`);
  await page.getByRole('button', { name: "Let's Get Started" }).click();
  for (const step of [2, 3, 4, 5, 6, 7]) {
    await expect(page.getByText(`${step} of 8`)).toBeVisible();
    await page.getByRole('button', { name: 'Skip', exact: true }).click();
  }
  await expect(page.getByText('8 of 8')).toBeVisible();
  await page.getByRole('button', { name: 'Explore MyStyle AI' }).click();
  await expect(page.getByRole('button', { name: 'Home' }).first()).toBeVisible();
  await expect(page.getByText('David')).toHaveCount(0);
});

test('shop and try-on stay labelled as demonstrations', async ({ page }) => {
  await register(page, `qa-shop-${Date.now()}@example.com`);
  await skipToApp(page);
  await page.getByRole('button', { name: 'Shop' }).first().click();
  await expect(page.getByText(/illustrative demonstration mockups/i)).toBeVisible();
  await page.getByRole('button', { name: 'Try On' }).first().click();
  await expect(page.getByText('Real try-on generation is not active')).toBeVisible();
  await expect(page.getByText('Neural fitting model simulation')).toHaveCount(0);
});

test('the stylist answers from the mock provider and can delete the conversation', async ({ page }) => {
  await register(page, `qa-stylist-${Date.now()}@example.com`);
  await skipToApp(page);
  await page.getByRole('button', { name: 'My Stylist' }).first().click();
  await expect(page.getByText('Demonstration stylist. This is not a live model.')).toBeVisible();
  await page.getByPlaceholder('Ask Aria...').fill('What should I wear to a wedding?');
  await page.getByRole('button', { name: 'Send message' }).click();
  const reply = page.getByText(/For a wedding, a breathable midi/).first();
  await expect(reply).toBeVisible();
  await expect(page.getByText(/verified retailer shopping is not connected/i)).toHaveCount(0);
  await page.reload();
  await page.getByRole('button', { name: 'My Stylist' }).first().click();
  await expect(page.getByText(/For a wedding, a breathable midi/).first()).toBeVisible();
  await page.getByRole('button', { name: 'New Session' }).click();
  await page.getByRole('button', { name: 'Start Fresh Session' }).click();
  await expect(page.getByText('The saved conversation was deleted.')).toBeVisible();
  await page.reload();
  await page.getByRole('button', { name: 'My Stylist' }).first().click();
  await expect(page.getByText(/For a wedding, a breathable midi/)).toHaveCount(0);
});

test('a wardrobe piece, family profile, and beauty look persist for one account only', async ({ page }) => {
  const emptySources: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error' && message.text().includes('empty string')) emptySources.push(message.text());
  });
  const email = `qa-records-${Date.now()}@example.com`;
  await register(page, email);
  await skipToApp(page);

  await page.getByRole('button', { name: /Browse All/ }).click();
  await page.getByRole('button', { name: 'Add Clothing Piece' }).click();
  await page.getByPlaceholder('e.g. Silk Satin Camisole, Belted Trench Coat').fill('QA linen shirt');
  await page.getByRole('button', { name: 'Save Piece to Wardrobe' }).click();
  await expect(page.getByText('Added "QA linen shirt" to your Digital Wardrobe')).toBeVisible();

  await page.getByRole('button', { name: 'Home' }).first().click();
  await page.getByRole('button', { name: 'Coordinate Family Outfits' }).click();
  await expect(page.getByText('Chloe')).toHaveCount(0);
  await page.getByRole('button', { name: /Family Profiles/ }).click();
  await expect(page.getByText('No family profiles added')).toBeVisible();
  await page.getByRole('button', { name: 'Add Member' }).click();
  await page.getByPlaceholder('e.g. David').fill('Sam');
  await page.getByRole('button', { name: 'Add to Family' }).click();
  await expect(page.getByText('Family profile saved.')).toBeVisible();
  await page.getByRole('button', { name: 'Occasion Planner' }).click();
  await page.getByRole('button', { name: 'Save Plan' }).click();
  await expect(page.getByText('Event plan saved.')).toBeVisible();

  await page.getByRole('button', { name: 'Home' }).first().click();
  await page.getByRole('button', { name: 'Open AI Beauty Studio' }).click();
  await expect(page.getByText('Preview generation is not yet available.')).toBeVisible();
  await page.getByRole('button', { name: 'Hairstyles' }).click();
  await page.getByRole('button', { name: 'Save', exact: true }).first().click();
  await expect(page.getByText('Look saved successfully.')).toBeVisible();
  await page.getByRole('button', { name: 'Complete Looks' }).click();
  await page.getByLabel('Look name').fill('QA wedding guest');
  await page.getByRole('button', { name: 'Save look', exact: true }).click();
  await expect(page.getByText('Look saved successfully.')).toBeVisible();

  await page.reload();
  await page.getByRole('button', { name: 'Open AI Beauty Studio' }).click();
  await page.getByRole('button', { name: /Saved \(/ }).click();
  await expect(page.getByText('QA wedding guest')).toBeVisible();
  await page.getByRole('button', { name: 'Back', exact: true }).click();
  await page.getByRole('button', { name: /Browse All/ }).click();
  await expect(page.getByText('QA linen shirt')).toBeVisible();

  await page.getByRole('button', { name: 'My Profile' }).first().click();
  await page.getByRole('button', { name: 'Sign out' }).click();
  await expect(page.getByRole('heading', { name: 'Create your account' })).toBeVisible();
  await page.getByLabel('Email').fill(`qa-other-${Date.now()}@example.com`);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByLabel('Confirm password').fill(password);
  await page.getByRole('button', { name: 'Create account' }).click();
  await skipToApp(page);
  await page.getByRole('button', { name: /Browse All/ }).click();
  await expect(page.getByText('QA linen shirt')).toHaveCount(0);
  await page.getByRole('button', { name: 'Home' }).first().click();
  await page.getByRole('button', { name: 'Coordinate Family Outfits' }).click();
  await page.getByRole('button', { name: /Family Profiles/ }).click();
  await expect(page.getByText('Sam')).toHaveCount(0);
  await page.getByRole('button', { name: 'Home' }).first().click();
  await page.getByRole('button', { name: 'Open AI Beauty Studio' }).click();
  await page.getByRole('button', { name: /Saved \(/ }).click();
  await expect(page.getByText('QA wedding guest')).toHaveCount(0);
  expect(emptySources).toEqual([]);
});

test('signed-in screens do not overflow at representative widths', async ({ page }) => {
  await register(page, `qa-layout-${Date.now()}@example.com`);
  await skipToApp(page);
  for (const width of [320, 375, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 800 });
    const overflow = await page.evaluate(() => {
      const width = document.documentElement.clientWidth;
      if (document.documentElement.scrollWidth <= width + 2) return '';
      return Array.from(document.querySelectorAll('body *'))
        .filter((node) => node instanceof HTMLElement && node.scrollWidth > width + 2)
        .slice(0, 4)
        .map((node) => `${node.tagName} ${(node as HTMLElement).className}`.slice(0, 160))
        .join(' || ');
    });
    expect(overflow, `horizontal overflow at ${width}px`).toBe('');
  }
});
