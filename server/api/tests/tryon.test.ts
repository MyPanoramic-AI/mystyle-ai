import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { authHeaders, register, startApi } from './harness.js';
import { waitForTryOnJob } from '../src/tryon/service.js';
import { loadTryOnConfig } from '../src/tryon/tryonConfig.js';

const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
).toString('base64');

async function grant(base: string, cookie: string, csrf: string, purpose: string): Promise<void> {
  const response = await fetch(`${base}/api/privacy/consent`, {
    method: 'POST',
    headers: authHeaders(cookie, csrf),
    body: JSON.stringify({ purpose, granted: true, captureMethod: 'settings_toggle' }),
  });
  assert.equal(response.status, 200);
}

async function uploadPerson(base: string, cookie: string, csrf: string): Promise<string> {
  await grant(base, cookie, csrf, 'private_photo_storage');
  const response = await fetch(`${base}/api/profile/photos/full_body_front`, {
    method: 'PUT',
    headers: authHeaders(cookie, csrf),
    body: JSON.stringify({ imageBase64: PNG }),
  });
  assert.equal(response.status, 201);
  const body = await response.json() as { mediaId: string };
  return body.mediaId;
}

async function pollJob(base: string, cookie: string, id: string): Promise<Record<string, unknown>> {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    const response = await fetch(`${base}/api/tryon/jobs/${id}`, { headers: { cookie } });
    assert.equal(response.status, 200);
    const body = await response.json() as { status: string };
    if (body.status !== 'queued' && body.status !== 'running') return body as Record<string, unknown>;
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
  throw new Error('try-on job did not finish');
}

test('mock try-on succeeds with demonstration result and does not consume credits', async () => {
  const api = await startApi();
  try {
    const ada = await register(api.base, 'tryon-success@example.com');
    const personMediaId = await uploadPerson(api.base, ada.cookie, ada.body.csrfToken);
    const before = await fetch(`${api.base}/api/credits`, { headers: { cookie: ada.cookie } });
    const beforeBody = await before.json() as { balance: number };

    const created = await fetch(`${api.base}/api/tryon/jobs`, {
      method: 'POST',
      headers: authHeaders(ada.cookie, ada.body.csrfToken),
      body: JSON.stringify({
        personMediaId,
        garmentImageBase64: PNG,
        category: 'tops',
        providerId: 'mock',
        idempotencyKey: 'mock-success-001',
      }),
    });
    assert.equal(created.status, 201);
    const job = await created.json() as { id: string; demonstration: boolean };
    const done = await pollJob(api.base, ada.cookie, job.id);
    assert.equal(done.status, 'succeeded');
    assert.equal(done.demonstration, true);
    assert.equal(done.resultKind, 'demonstration');
    assert.match(String(done.label), /Demonstration/i);
    assert.ok(done.resultMediaId);

    const media = await fetch(`${api.base}/api/media/${done.resultMediaId}`, { headers: { cookie: ada.cookie } });
    assert.equal(media.status, 200);
    assert.equal(media.headers.get('content-type'), 'image/png');

    const after = await fetch(`${api.base}/api/credits`, { headers: { cookie: ada.cookie } });
    const afterBody = await after.json() as { balance: number };
    assert.equal(afterBody.balance, beforeBody.balance);
  } finally {
    await api.close();
  }
});

test('duplicate try-on idempotency returns the same job', async () => {
  const api = await startApi();
  try {
    const ada = await register(api.base, 'tryon-idem@example.com');
    const personMediaId = await uploadPerson(api.base, ada.cookie, ada.body.csrfToken);
    const body = {
      personMediaId,
      garmentImageBase64: PNG,
      category: 'bottoms',
      providerId: 'mock',
      idempotencyKey: 'same-key-xyz',
    };
    const first = await fetch(`${api.base}/api/tryon/jobs`, {
      method: 'POST',
      headers: authHeaders(ada.cookie, ada.body.csrfToken),
      body: JSON.stringify(body),
    });
    const second = await fetch(`${api.base}/api/tryon/jobs`, {
      method: 'POST',
      headers: authHeaders(ada.cookie, ada.body.csrfToken),
      body: JSON.stringify(body),
    });
    assert.equal(first.status, 201);
    assert.equal(second.status, 200);
    const a = await first.json() as { id: string };
    const b = await second.json() as { id: string; duplicate?: boolean };
    assert.equal(a.id, b.id);
    assert.equal(b.duplicate, true);
  } finally {
    await api.close();
  }
});

test('invalid person image payload is rejected', async () => {
  const api = await startApi();
  try {
    const ada = await register(api.base, 'tryon-invalid@example.com');
    await grant(api.base, ada.cookie, ada.body.csrfToken, 'private_photo_storage');
    const response = await fetch(`${api.base}/api/tryon/jobs`, {
      method: 'POST',
      headers: authHeaders(ada.cookie, ada.body.csrfToken),
      body: JSON.stringify({
        personMediaId: 'missing-media-id-0001',
        garmentImageBase64: PNG,
        category: 'tops',
        idempotencyKey: 'invalid-person-1',
      }),
    });
    assert.equal(response.status, 404);
  } finally {
    await api.close();
  }
});

test('live provider without external-photo-AI consent is refused', async () => {
  const api = await startApi({}, {
    tryOnConfig: { ...loadTryOnConfig(), allowLive: true, maxBudgetUsd: 10, fashnApiKey: 'test-key-not-used' },
  });
  try {
    const ada = await register(api.base, 'tryon-consent@example.com');
    const personMediaId = await uploadPerson(api.base, ada.cookie, ada.body.csrfToken);
    const response = await fetch(`${api.base}/api/tryon/jobs`, {
      method: 'POST',
      headers: authHeaders(ada.cookie, ada.body.csrfToken),
      body: JSON.stringify({
        personMediaId,
        garmentImageBase64: PNG,
        category: 'tops',
        providerId: 'fashn-tryon-v1.6',
        idempotencyKey: 'needs-consent-1',
      }),
    });
    assert.equal(response.status, 403);
    const body = await response.json() as { code: string };
    assert.equal(body.code, 'external_photo_ai_consent_required');
  } finally {
    await api.close();
  }
});

test('live mode stays disabled by default', async () => {
  const api = await startApi();
  try {
    const ada = await register(api.base, 'tryon-live-off@example.com');
    const personMediaId = await uploadPerson(api.base, ada.cookie, ada.body.csrfToken);
    await grant(api.base, ada.cookie, ada.body.csrfToken, 'external_photo_ai');
    const availability = await fetch(`${api.base}/api/tryon/availability`, { headers: { cookie: ada.cookie } });
    const avail = await availability.json() as { liveEnabled: boolean };
    assert.equal(avail.liveEnabled, false);

    const response = await fetch(`${api.base}/api/tryon/jobs`, {
      method: 'POST',
      headers: authHeaders(ada.cookie, ada.body.csrfToken),
      body: JSON.stringify({
        personMediaId,
        garmentImageBase64: PNG,
        category: 'tops',
        providerId: 'fashn-tryon-v1.6',
        idempotencyKey: 'live-blocked-1',
      }),
    });
    assert.equal(response.status, 403);
    const body = await response.json() as { code: string };
    assert.equal(body.code, 'live_tryon_disabled');
  } finally {
    await api.close();
  }
});

test('failed mock scenario surfaces failure without credits', async () => {
  const api = await startApi();
  try {
    const ada = await register(api.base, 'tryon-fail@example.com');
    const personMediaId = await uploadPerson(api.base, ada.cookie, ada.body.csrfToken);
    const created = await fetch(`${api.base}/api/tryon/jobs`, {
      method: 'POST',
      headers: authHeaders(ada.cookie, ada.body.csrfToken),
      body: JSON.stringify({
        personMediaId,
        garmentImageBase64: PNG,
        category: 'outerwear',
        providerId: 'mock',
        mockScenario: 'provider_error',
        idempotencyKey: 'mock-fail-001',
      }),
    });
    assert.equal(created.status, 201);
    const job = await created.json() as { id: string };
    const done = await pollJob(api.base, ada.cookie, job.id);
    assert.equal(done.status, 'failed');
    assert.equal(done.errorCode, 'provider_error');
    assert.equal(done.resultMediaId, null);
  } finally {
    await api.close();
  }
});

test('try-on jobs are isolated between accounts', async () => {
  const api = await startApi();
  try {
    const ada = await register(api.base, 'tryon-ada@example.com');
    const grace = await register(api.base, 'tryon-grace@example.com');
    const personMediaId = await uploadPerson(api.base, ada.cookie, ada.body.csrfToken);
    const created = await fetch(`${api.base}/api/tryon/jobs`, {
      method: 'POST',
      headers: authHeaders(ada.cookie, ada.body.csrfToken),
      body: JSON.stringify({
        personMediaId,
        garmentImageBase64: PNG,
        category: 'one-pieces',
        providerId: 'mock',
        idempotencyKey: 'ada-only-job',
      }),
    });
    const job = await created.json() as { id: string };
    await pollJob(api.base, ada.cookie, job.id);
    const stolen = await fetch(`${api.base}/api/tryon/jobs/${job.id}`, { headers: { cookie: grace.cookie } });
    assert.equal(stolen.status, 404);
    const listed = await fetch(`${api.base}/api/tryon/jobs`, { headers: { cookie: grace.cookie } });
    const body = await listed.json() as { jobs: unknown[] };
    assert.equal(body.jobs.length, 0);
  } finally {
    await api.close();
  }
});

test('waitForTryOnJob helper resolves demonstration jobs', async () => {
  const api = await startApi();
  try {
    const ada = await register(api.base, 'tryon-wait@example.com');
    const personMediaId = await uploadPerson(api.base, ada.cookie, ada.body.csrfToken);
    const created = await fetch(`${api.base}/api/tryon/jobs`, {
      method: 'POST',
      headers: authHeaders(ada.cookie, ada.body.csrfToken),
      body: JSON.stringify({
        personMediaId,
        garmentImageBase64: PNG,
        category: 'tops',
        providerId: 'mock',
        idempotencyKey: 'wait-helper-1',
      }),
    });
    const job = await created.json() as { id: string };
    const done = await waitForTryOnJob(api.db, ada.body.userId, job.id);
    assert.equal(done.status, 'succeeded');
  } finally {
    await api.close();
  }
});

test('garment list prefers wardrobe items and prepare reports live blockers without spending', async () => {
  const api = await startApi();
  try {
    const ada = await register(api.base, 'tryon-garments@example.com');
    const personMediaId = await uploadPerson(api.base, ada.cookie, ada.body.csrfToken);
    const media = await fetch(`${api.base}/api/media`, {
      method: 'POST',
      headers: authHeaders(ada.cookie, ada.body.csrfToken),
      body: JSON.stringify({ purpose: 'wardrobe', imageBase64: PNG }),
    });
    assert.equal(media.status, 201);
    const mediaBody = await media.json() as { id: string };
    const wardrobe = await fetch(`${api.base}/api/wardrobe`, {
      method: 'POST',
      headers: authHeaders(ada.cookie, ada.body.csrfToken),
      body: JSON.stringify({
        name: 'Linen shirt',
        category: 'tops',
        mediaId: mediaBody.id,
      }),
    });
    assert.equal(wardrobe.status, 201);
    const item = await wardrobe.json() as { id: string };

    const listed = await fetch(`${api.base}/api/tryon/garments`, { headers: { cookie: ada.cookie } });
    assert.equal(listed.status, 200);
    const garments = await listed.json() as {
      preferredSource: string;
      garments: { wardrobeItemId: string | null; source: string }[];
      shop: { note: string };
    };
    assert.equal(garments.preferredSource, 'wardrobe');
    assert.equal(garments.garments[0]?.wardrobeItemId, item.id);
    assert.match(garments.shop.note, /not verified retailer/i);

    const prepared = await fetch(`${api.base}/api/tryon/prepare`, {
      method: 'POST',
      headers: authHeaders(ada.cookie, ada.body.csrfToken),
      body: JSON.stringify({
        personMediaId,
        wardrobeItemId: item.id,
        category: 'tops',
        providerId: 'fashn-tryon-v1.6',
      }),
    });
    assert.equal(prepared.status, 200);
    const prep = await prepared.json() as { ok: boolean; live: boolean; blockers: string[]; estimatedCostUsd: number };
    assert.equal(prep.ok, false);
    assert.equal(prep.live, true);
    assert.ok(prep.blockers.includes('live_tryon_disabled'));
    assert.ok(prep.estimatedCostUsd > 0);

    const credits = await fetch(`${api.base}/api/credits`, { headers: { cookie: ada.cookie } });
    const balance = await credits.json() as { balance: number };
    assert.equal(balance.balance, 0);

    const created = await fetch(`${api.base}/api/tryon/jobs`, {
      method: 'POST',
      headers: authHeaders(ada.cookie, ada.body.csrfToken),
      body: JSON.stringify({
        personMediaId,
        wardrobeItemId: item.id,
        category: 'tops',
        providerId: 'mock',
        idempotencyKey: 'wardrobe-mock-1',
      }),
    });
    assert.equal(created.status, 201);
    const job = await created.json() as { id: string };
    const done = await pollJob(api.base, ada.cookie, job.id);
    assert.equal(done.status, 'succeeded');
    assert.equal(done.demonstration, true);
  } finally {
    await api.close();
  }
});

test('customer mock is refused when allowCustomerMock is false', async () => {
  const api = await startApi({}, {
    tryOnConfig: { ...loadTryOnConfig(), allowCustomerMock: false, allowLive: false },
  });
  try {
    const ada = await register(api.base, 'tryon-mock-off@example.com');
    const personMediaId = await uploadPerson(api.base, ada.cookie, ada.body.csrfToken);
    const availability = await fetch(`${api.base}/api/tryon/availability`, { headers: { cookie: ada.cookie } });
    const avail = await availability.json() as { generationMode: string };
    assert.equal(avail.generationMode, 'unavailable');

    const created = await fetch(`${api.base}/api/tryon/jobs`, {
      method: 'POST',
      headers: authHeaders(ada.cookie, ada.body.csrfToken),
      body: JSON.stringify({
        personMediaId,
        garmentImageBase64: PNG,
        category: 'tops',
        providerId: 'mock',
        idempotencyKey: 'mock-off-1',
      }),
    });
    assert.equal(created.status, 403);
    const body = await created.json() as { code: string };
    assert.equal(body.code, 'mock_tryon_disabled');
  } finally {
    await api.close();
  }
});

test('fittings list and delete remove private result media', async () => {
  const api = await startApi();
  try {
    const ada = await register(api.base, 'tryon-fittings@example.com');
    const personMediaId = await uploadPerson(api.base, ada.cookie, ada.body.csrfToken);
    const created = await fetch(`${api.base}/api/tryon/jobs`, {
      method: 'POST',
      headers: authHeaders(ada.cookie, ada.body.csrfToken),
      body: JSON.stringify({
        personMediaId,
        garmentImageBase64: PNG,
        category: 'tops',
        providerId: 'mock',
        idempotencyKey: 'fitting-save-1',
      }),
    });
    const job = await created.json() as { id: string };
    const done = await pollJob(api.base, ada.cookie, job.id);
    assert.equal(done.status, 'succeeded');
    const fittings = await fetch(`${api.base}/api/tryon/fittings`, { headers: { cookie: ada.cookie } });
    const listed = await fittings.json() as { fittings: { id: string; resultMediaId: string }[] };
    assert.equal(listed.fittings.length, 1);
    const resultId = listed.fittings[0]!.resultMediaId;
    const deleted = await fetch(`${api.base}/api/tryon/jobs/${job.id}`, {
      method: 'DELETE',
      headers: authHeaders(ada.cookie, ada.body.csrfToken),
    });
    assert.equal(deleted.status, 200);
    const media = await fetch(`${api.base}/api/media/${resultId}`, { headers: { cookie: ada.cookie } });
    assert.equal(media.status, 404);
    const after = await fetch(`${api.base}/api/tryon/fittings`, { headers: { cookie: ada.cookie } });
    const afterBody = await after.json() as { fittings: unknown[] };
    assert.equal(afterBody.fittings.length, 0);
  } finally {
    await api.close();
  }
});

test('live try-on is blocked when customer credits are insufficient', async () => {
  const TOKEN = 'admin-token-for-tests-only';
  const api = await startApi({ adminToken: TOKEN }, {
    tryOnConfig: {
      ...loadTryOnConfig(),
      allowLive: true,
      maxBudgetUsd: 10,
      fashnApiKey: 'test-key-not-used',
      customerCreditCost: 1,
    },
  });
  try {
    const ada = await register(api.base, 'tryon-nocredits@example.com');
    const personMediaId = await uploadPerson(api.base, ada.cookie, ada.body.csrfToken);
    await grant(api.base, ada.cookie, ada.body.csrfToken, 'external_photo_ai');
    const entitled = await fetch(`${api.base}/api/admin/entitlements`, {
      method: 'POST',
      headers: { authorization: `Bearer ${TOKEN}`, 'content-type': 'application/json' },
      body: JSON.stringify({ userId: ada.body.userId, planCode: 'PERSONAL', status: 'active' }),
    });
    assert.equal(entitled.status, 200);

    const prepared = await fetch(`${api.base}/api/tryon/prepare`, {
      method: 'POST',
      headers: authHeaders(ada.cookie, ada.body.csrfToken),
      body: JSON.stringify({
        personMediaId,
        garmentImageBase64: PNG,
        category: 'tops',
        providerId: 'fashn-tryon-v1.6',
      }),
    });
    assert.equal(prepared.status, 200);
    const prep = await prepared.json() as { ok: boolean; blockers: string[] };
    assert.equal(prep.ok, false);
    assert.ok(prep.blockers.includes('insufficient_credits'));

    const created = await fetch(`${api.base}/api/tryon/jobs`, {
      method: 'POST',
      headers: authHeaders(ada.cookie, ada.body.csrfToken),
      body: JSON.stringify({
        personMediaId,
        garmentImageBase64: PNG,
        category: 'tops',
        providerId: 'fashn-tryon-v1.6',
        idempotencyKey: 'no-credits-1',
      }),
    });
    assert.equal(created.status, 409);
    const body = await created.json() as { code: string };
    assert.equal(body.code, 'insufficient_credits');
  } finally {
    await api.close();
  }
});

test('live try-on is blocked when ai.image entitlement is missing', async () => {
  const TOKEN = 'admin-token-for-tests-only';
  const api = await startApi({ adminToken: TOKEN }, {
    tryOnConfig: {
      ...loadTryOnConfig(),
      allowLive: true,
      maxBudgetUsd: 10,
      fashnApiKey: 'test-key-not-used',
    },
  });
  try {
    const ada = await register(api.base, 'tryon-noentitle@example.com');
    const personMediaId = await uploadPerson(api.base, ada.cookie, ada.body.csrfToken);
    await grant(api.base, ada.cookie, ada.body.csrfToken, 'external_photo_ai');
    api.db.prepare(
      `UPDATE subscription_entitlements SET feature_keys_json = '["account.basic"]' WHERE user_id = ? AND status = 'active'`,
    ).run(ada.body.userId);
    await fetch(`${api.base}/api/admin/credits/allocate`, {
      method: 'POST',
      headers: { authorization: `Bearer ${TOKEN}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        userId: ada.body.userId,
        amount: 20,
        periodKey: '2026-10',
        idempotencyKey: 'tryon-entitle-alloc',
        reason: 'Entitlement blocker test',
      }),
    });

    const prepared = await fetch(`${api.base}/api/tryon/prepare`, {
      method: 'POST',
      headers: authHeaders(ada.cookie, ada.body.csrfToken),
      body: JSON.stringify({
        personMediaId,
        garmentImageBase64: PNG,
        category: 'tops',
        providerId: 'fashn-tryon-v1.6',
      }),
    });
    const prep = await prepared.json() as { ok: boolean; blockers: string[] };
    assert.equal(prep.ok, false);
    assert.ok(prep.blockers.includes('feature_unavailable'));

    const created = await fetch(`${api.base}/api/tryon/jobs`, {
      method: 'POST',
      headers: authHeaders(ada.cookie, ada.body.csrfToken),
      body: JSON.stringify({
        personMediaId,
        garmentImageBase64: PNG,
        category: 'tops',
        providerId: 'fashn-tryon-v1.6',
        idempotencyKey: 'no-entitle-1',
      }),
    });
    assert.equal(created.status, 403);
    const body = await created.json() as { code: string };
    assert.equal(body.code, 'feature_unavailable');
  } finally {
    await api.close();
  }
});

test('completed result media is distinct from the garment input and survives refresh', async () => {
  const api = await startApi();
  try {
    const ada = await register(api.base, 'tryon-result-bind@example.com');
    const personMediaId = await uploadPerson(api.base, ada.cookie, ada.body.csrfToken);
    const created = await fetch(`${api.base}/api/tryon/jobs`, {
      method: 'POST',
      headers: authHeaders(ada.cookie, ada.body.csrfToken),
      body: JSON.stringify({
        personMediaId,
        garmentImageBase64: PNG,
        category: 'tops',
        providerId: 'mock',
        idempotencyKey: 'result-bind-1',
      }),
    });
    assert.equal(created.status, 201);
    const job = await created.json() as { id: string };
    const done = await pollJob(api.base, ada.cookie, job.id) as {
      status: string;
      demonstration: boolean;
      resultMediaId: string;
      garmentMediaId: string;
      personMediaId: string;
    };
    assert.equal(done.status, 'succeeded');
    assert.equal(done.demonstration, true);
    assert.ok(done.resultMediaId);
    assert.notEqual(done.resultMediaId, done.garmentMediaId);
    assert.notEqual(done.resultMediaId, done.personMediaId);

    const refreshed = await fetch(`${api.base}/api/tryon/jobs/${job.id}`, { headers: { cookie: ada.cookie } });
    assert.equal(refreshed.status, 200);
    const again = await refreshed.json() as { resultMediaId: string; garmentMediaId: string };
    assert.equal(again.resultMediaId, done.resultMediaId);
    assert.notEqual(again.resultMediaId, again.garmentMediaId);

    const fittings = await fetch(`${api.base}/api/tryon/fittings`, { headers: { cookie: ada.cookie } });
    const listed = await fittings.json() as { fittings: { id: string; resultMediaId: string }[] };
    assert.equal(listed.fittings[0]?.resultMediaId, done.resultMediaId);
  } finally {
    await api.close();
  }
});

test('failed generation leaves no result media for the UI to render', async () => {
  const api = await startApi();
  try {
    const ada = await register(api.base, 'tryon-fail-norslt@example.com');
    const personMediaId = await uploadPerson(api.base, ada.cookie, ada.body.csrfToken);
    const created = await fetch(`${api.base}/api/tryon/jobs`, {
      method: 'POST',
      headers: authHeaders(ada.cookie, ada.body.csrfToken),
      body: JSON.stringify({
        personMediaId,
        garmentImageBase64: PNG,
        category: 'outerwear',
        providerId: 'mock',
        mockScenario: 'provider_error',
        idempotencyKey: 'fail-no-result-2',
      }),
    });
    assert.equal(created.status, 201);
    const job = await created.json() as { id: string };
    assert.ok(job.id);
    const done = await pollJob(api.base, ada.cookie, job.id);
    assert.equal(done.status, 'failed');
    assert.equal(done.resultMediaId, null);

    const fittings = await fetch(`${api.base}/api/tryon/fittings`, { headers: { cookie: ada.cookie } });
    const listed = await fittings.json() as { fittings: unknown[] };
    assert.equal(listed.fittings.length, 0);
  } finally {
    await api.close();
  }
});

test('authorised mocked FASHN path stores a provider result without calling the real API', async () => {
  const TOKEN = 'admin-token-for-tests-only';
  const providerPng = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAEklEQVR42mP8z8BQz0AEYBxVSF+FAP5IAv8m4n6cAAAAAElFTkSuQmCC',
    'base64',
  );
  const mockFetch: typeof fetch = async (input) => {
    const url = String(input);
    if (url.includes('/run')) {
      return new Response(JSON.stringify({ id: 'mock-fashn-job' }), {
        status: 200,
        headers: { 'content-type': 'application/json', 'x-fashn-credits-used': '1' },
      });
    }
    if (url.includes('/status/')) {
      return new Response(JSON.stringify({
        status: 'completed',
        output: [`data:image/png;base64,${providerPng.toString('base64')}`],
      }), {
        status: 200,
        headers: { 'content-type': 'application/json', 'x-fashn-credits-used': '1' },
      });
    }
    throw new Error(`unexpected provider fetch: ${url}`);
  };

  const api = await startApi({ adminToken: TOKEN }, {
    tryOnConfig: {
      ...loadTryOnConfig(),
      allowLive: true,
      maxBudgetUsd: 1,
      fashnApiKey: 'test-key-local-only',
      fashnBaseUrl: 'https://api.fashn.ai/v1',
    },
    tryOnFetch: mockFetch,
  });
  try {
    const ada = await register(api.base, 'tryon-fashn-mock@example.com');
    const personMediaId = await uploadPerson(api.base, ada.cookie, ada.body.csrfToken);
    await grant(api.base, ada.cookie, ada.body.csrfToken, 'external_photo_ai');
    const entitled = await fetch(`${api.base}/api/admin/entitlements`, {
      method: 'POST',
      headers: { authorization: `Bearer ${TOKEN}`, 'content-type': 'application/json' },
      body: JSON.stringify({ userId: ada.body.userId, planCode: 'PERSONAL', status: 'active' }),
    });
    assert.equal(entitled.status, 200);
    const allocated = await fetch(`${api.base}/api/admin/credits/allocate`, {
      method: 'POST',
      headers: { authorization: `Bearer ${TOKEN}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        userId: ada.body.userId,
        amount: 10,
        periodKey: '2026-10',
        idempotencyKey: 'tryon-fashn-alloc',
        reason: 'Mocked FASHN path test',
      }),
    });
    assert.equal(allocated.status, 200);

    const availability = await fetch(`${api.base}/api/tryon/availability`, { headers: { cookie: ada.cookie } });
    const avail = await availability.json() as { readiness: { liveReady: boolean }; liveEnabled: boolean };
    assert.equal(avail.liveEnabled, true);
    assert.equal(avail.readiness.liveReady, true);

    const prepared = await fetch(`${api.base}/api/tryon/prepare`, {
      method: 'POST',
      headers: authHeaders(ada.cookie, ada.body.csrfToken),
      body: JSON.stringify({
        personMediaId,
        garmentImageBase64: PNG,
        category: 'tops',
        providerId: 'fashn-tryon-v1.6',
      }),
    });
    const prep = await prepared.json() as { ok: boolean; blockers: string[] };
    assert.equal(prep.ok, true);
    assert.deepEqual(prep.blockers, []);

    const created = await fetch(`${api.base}/api/tryon/jobs`, {
      method: 'POST',
      headers: authHeaders(ada.cookie, ada.body.csrfToken),
      body: JSON.stringify({
        personMediaId,
        garmentImageBase64: PNG,
        category: 'tops',
        providerId: 'fashn-tryon-v1.6',
        idempotencyKey: 'fashn-mock-path-1',
      }),
    });
    assert.equal(created.status, 201);
    const job = await created.json() as { id: string };
    const done = await pollJob(api.base, ada.cookie, job.id);
    assert.equal(done.status, 'succeeded');
    assert.equal(done.demonstration, false);
    assert.equal(done.resultKind, 'provider');
    assert.match(String(done.label), /Provider try-on result/i);
    assert.ok(done.resultMediaId);

    const media = await fetch(`${api.base}/api/media/${done.resultMediaId}`, { headers: { cookie: ada.cookie } });
    assert.equal(media.status, 200);
    const bytes = Buffer.from(await media.arrayBuffer());
    assert.ok(bytes.equals(providerPng));
  } finally {
    await api.close();
  }
});

test('catalogue garmentImageUrl is loaded from static assets without client base64', async () => {
  const staticRoot = mkdtempSync(path.join(tmpdir(), 'mystyle-static-'));
  const assetsDir = path.join(staticRoot, 'assets');
  mkdirSync(assetsDir, { recursive: true });
  const pngBytes = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    'base64',
  );
  writeFileSync(path.join(assetsDir, 'shop-garment.png'), pngBytes);

  const api = await startApi({ staticDir: staticRoot, appPublicUrl: 'http://127.0.0.1:4173' });
  try {
    const ada = await register(api.base, 'tryon-catalogue-url@example.com');
    const personMediaId = await uploadPerson(api.base, ada.cookie, ada.body.csrfToken);

    const created = await fetch(`${api.base}/api/tryon/jobs`, {
      method: 'POST',
      headers: authHeaders(ada.cookie, ada.body.csrfToken),
      body: JSON.stringify({
        personMediaId,
        garmentImageUrl: '/assets/shop-garment.png',
        category: 'tops',
        providerId: 'mock',
        idempotencyKey: 'catalogue-url-001',
      }),
    });
    const createdText = await created.text();
    assert.equal(created.status, 201, createdText);
    const job = JSON.parse(createdText) as { id: string };
    const done = await pollJob(api.base, ada.cookie, job.id);
    assert.equal(done.status, 'succeeded');
    assert.equal(done.demonstration, true);
    assert.ok(done.resultMediaId);
  } finally {
    await api.close();
  }
});

test('allowlisted remote garmentImageUrl is fetched server-side', async () => {
  const pngBytes = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    'base64',
  );
  const remoteUrl = 'https://images.unsplash.com/photo-demo-garment';
  const tryOnFetch: typeof fetch = async (input, init) => {
    const url = String(input);
    if (url === remoteUrl) {
      return new Response(pngBytes, { status: 200, headers: { 'content-type': 'image/png' } });
    }
    return fetch(input, init);
  };
  const api = await startApi({}, { tryOnFetch });
  try {
    const ada = await register(api.base, 'tryon-remote-url@example.com');
    const personMediaId = await uploadPerson(api.base, ada.cookie, ada.body.csrfToken);
    const created = await fetch(`${api.base}/api/tryon/jobs`, {
      method: 'POST',
      headers: authHeaders(ada.cookie, ada.body.csrfToken),
      body: JSON.stringify({
        personMediaId,
        garmentImageUrl: remoteUrl,
        category: 'tops',
        providerId: 'mock',
        idempotencyKey: 'remote-url-001',
      }),
    });
    const createdText = await created.text();
    assert.equal(created.status, 201, createdText);
    const job = JSON.parse(createdText) as { id: string };
    const done = await pollJob(api.base, ada.cookie, job.id);
    assert.equal(done.status, 'succeeded');
  } finally {
    await api.close();
  }
});
