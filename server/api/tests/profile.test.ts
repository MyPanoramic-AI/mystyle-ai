import assert from 'node:assert/strict';
import test from 'node:test';
import { authHeaders, register, startApi } from './harness.js';

test('a customer can save profile, measurements, and preferences', async () => {
  const api = await startApi();
  try {
    const created = await register(api.base, 'ada@example.com');
    const headers = authHeaders(created.cookie, created.body.csrfToken);
    const saved = await fetch(`${api.base}/api/profile`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        displayName: 'Ada',
        styles: ['tailored'],
        sizes: { tops: 'M' },
        budgetTier: '600-1000',
        favouriteColours: ['navy'],
        interests: ['workwear'],
        measurements: { heightCm: 168, waistCm: 70 },
      }),
    });
    const profile = await saved.json() as { completionStatus: string; measurements: { heightCm: number }; displayName: string };
    assert.equal(saved.status, 200);
    assert.equal(profile.displayName, 'Ada');
    assert.equal(profile.completionStatus, 'complete');
    assert.equal(profile.measurements.heightCm, 168);
    const preferences = await fetch(`${api.base}/api/preferences`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ aiPersonalisationConsent: true, privacy: { shareProfileWithStylist: false }, notifications: { productAlerts: false } }),
    });
    const preferenceBody = await preferences.json() as { aiPersonalisationConsent: boolean };
    assert.equal(preferences.status, 200);
    assert.equal(preferenceBody.aiPersonalisationConsent, true);
    const invalid = await fetch(`${api.base}/api/profile`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ measurements: { heightCm: 10 } }),
    });
    assert.equal(invalid.status, 400);
  } finally {
    await api.close();
  }
});

test('credits and entitlements are not granted by the API', async () => {
  const api = await startApi();
  try {
    const created = await register(api.base, 'ada@example.com');
    const headers = { cookie: created.cookie };
    const credits = await fetch(`${api.base}/api/credits`, { headers });
    const entitlements = await fetch(`${api.base}/api/entitlements`, { headers });
    const integrations = await fetch(`${api.base}/api/integrations`, { headers });
    assert.deepEqual(await credits.json(), { balance: 0, entries: [] });
    assert.deepEqual(await entitlements.json(), { entitlements: [] });
    const boundary = await integrations.json() as { tryOn: { status: string }; billing: { status: string } };
    assert.equal(boundary.tryOn.status, 'not_connected');
    assert.equal(boundary.billing.status, 'not_connected');
  } finally {
    await api.close();
  }
});
