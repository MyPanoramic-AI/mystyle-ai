import assert from 'node:assert/strict';
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
