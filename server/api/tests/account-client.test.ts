import assert from 'node:assert/strict';
import test from 'node:test';
import { AccountApiError, createAccountApi } from '../../../src/services/accountApi.js';
import { buildImportProfile, emptyAccountProfile, inspectBrowserStore, profileForAccount, NEVER_IMPORT_KEYS } from '../../../src/services/profileContract.js';
import { registrationError } from '../../../src/services/registrationRules.js';
import type { UserProfile } from '../../../src/types/index.js';

test('registration rules reject a weak password, a mismatch, and a bad email', () => {
  assert.equal(registrationError({ email: 'not-an-email', password: 'correct-horse-12', confirmation: 'correct-horse-12' }), 'Enter a valid email address.');
  assert.equal(registrationError({ email: 'ada@example.com', password: 'short', confirmation: 'short' }), 'Use a password of at least 12 characters.');
  assert.equal(registrationError({ email: 'ada@example.com', password: 'correct-horse-12', confirmation: 'other-horse-12' }), 'The passwords do not match.');
  assert.equal(registrationError({ email: 'ada@example.com', password: 'correct-horse-12', confirmation: 'correct-horse-12' }), null);
});

test('the API client sends the cookie and CSRF token and retries one CSRF failure', async () => {
  const calls: { path: string; headers: Headers; body: string | undefined }[] = [];
  let csrfAttempts = 0;
  const fetchImpl: typeof fetch = async (input, init) => {
    const path = String(input);
    calls.push({ path, headers: new Headers(init?.headers), body: typeof init?.body === 'string' ? init.body : undefined });
    if (path.endsWith('/api/auth/login')) {
      return new Response(JSON.stringify({ userId: 'ada', csrfToken: 'csrf-1' }), { status: 200 });
    }
    if (path.endsWith('/api/profile') && csrfAttempts === 0) {
      csrfAttempts += 1;
      return new Response(JSON.stringify({ code: 'invalid_csrf', message: 'The security token was missing or incorrect.' }), { status: 403 });
    }
    if (path.endsWith('/api/auth/session')) {
      return new Response(JSON.stringify({ userId: 'ada', email: 'ada@example.com', csrfToken: 'csrf-2', expiresAt: '2026-10-17T00:00:00.000Z' }), { status: 200 });
    }
    return new Response(JSON.stringify({ displayName: 'Ada' }), { status: 200 });
  };
  const api = createAccountApi({ fetchImpl });
  await api.login('ada@example.com', 'correct-horse-12');
  const saved = await api.saveProfile({ displayName: 'Ada' });
  assert.equal((saved as { displayName: string }).displayName, 'Ada');
  const login = calls[0];
  assert.equal(login?.headers.get('cookie') ?? null, null);
  assert.equal(JSON.parse(login?.body ?? '{}').password, 'correct-horse-12');
  const profileCalls = calls.filter((call) => call.path.endsWith('/api/profile'));
  assert.equal(profileCalls[0]?.headers.get('x-csrf-token'), 'csrf-1');
  assert.equal(profileCalls[1]?.headers.get('x-csrf-token'), 'csrf-2');
  assert.equal(profileCalls[0]?.body?.includes('userId'), false);
});

test('network and credential failures stay explicit', async () => {
  const down = createAccountApi({
    fetchImpl: async () => {
      throw new Error('offline');
    },
  });
  await assert.rejects(() => down.health(), (error: unknown) => error instanceof AccountApiError && error.status === 0);
  const denied = createAccountApi({
    fetchImpl: async () => new Response(JSON.stringify({ code: 'invalid_credentials', message: 'The email or password was not accepted.' }), { status: 401 }),
  });
  await assert.rejects(() => denied.login('ada@example.com', 'correct-horse-12'), (error: unknown) => error instanceof AccountApiError && error.code === 'invalid_credentials');
});

test('browser demonstration records are not imported unless selected, and family keys never are', () => {
  const store = new Map<string, string>();
  store.set('mystyle_ai_user_profile_v1', JSON.stringify({
    personal: { firstName: 'Nandi', heightCm: 168, country: 'South Africa', currency: 'ZAR (R)' },
    styles: ['Modern & Minimal'],
    sizes: { topsSize: 'M (SA 34)', bottomsSize: '', dressSize: '', shoeSize: '', waistCm: '72' },
    colours: { favoriteColors: ['Navy'], avoidColors: [], fitPreference: 'regular', experimentation: 'balanced' },
    shopping: { itemBudget: '600-1000', priorities: ['Comfort'], favoriteRetailers: ['Woolworths'] },
  }));
  store.set('mystyle_family_members_v1', JSON.stringify([{ name: 'Demo child', classification: 'Child' }]));
  const browser = { getItem: (key: string) => store.get(key) ?? null };
  const preview = inspectBrowserStore(browser);
  assert.equal(preview?.blockedKeysPresent.includes('mystyle_family_members_v1'), true);
  assert.equal(NEVER_IMPORT_KEYS.includes('mystyle_family_members_v1'), true);
  const skipped = buildImportProfile(emptyAccountProfile(), browser, { details: false, sizes: false, colours: false, shopping: false, measurements: false });
  assert.equal(skipped.personal.firstName, '');
  assert.equal(skipped.personal.heightCm, undefined);
  const selected = buildImportProfile(emptyAccountProfile(), browser, { details: true, sizes: true, colours: false, shopping: false, measurements: false });
  assert.equal(selected.personal.firstName, 'Nandi');
  assert.equal(selected.styles[0], 'Modern & Minimal');
  assert.equal(selected.sizes.topsSize, 'M (SA 34)');
  assert.equal(selected.sizes.waistCm, '');
  assert.equal(selected.personal.heightCm, undefined);
  assert.equal(JSON.stringify(selected).includes('Demo child'), false);
});

test('a newly signed-in profile replaces the previous account instead of merging it', () => {
  const previous: UserProfile = {
    ...emptyAccountProfile(),
    personal: { firstName: 'Ada', country: 'South Africa', currency: 'ZAR (R)', heightCm: 180 },
    sizes: { topsSize: 'L (SA 36)', bottomsSize: '', dressSize: '', shoeSize: '', waistCm: '80' },
  };
  const next = profileForAccount({
    ...emptyAccountProfile(),
    personal: { firstName: 'Grace', country: 'Namibia', currency: 'ZAR (R)' },
    onboardingStatus: 'completed',
  });
  assert.equal(next.personal.firstName, 'Grace');
  assert.equal(next.personal.heightCm, undefined);
  assert.equal(next.sizes.waistCm, '');
  assert.equal(JSON.stringify(next).includes('Ada'), false);
  assert.equal(JSON.stringify(previous).includes('Ada'), true);
});
