import assert from 'node:assert/strict';
import test from 'node:test';
import { authHeaders, register, startApi } from './harness.js';

const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xd9]).toString('base64');

async function grantStorage(base: string, cookie: string, csrf: string): Promise<void> {
  const response = await fetch(`${base}/api/privacy/consent`, {
    method: 'POST',
    headers: authHeaders(cookie, csrf),
    body: JSON.stringify({ purpose: 'private_photo_storage', granted: true, captureMethod: 'settings_toggle' }),
  });
  assert.equal(response.status, 200);
}

test('private photographs are type-checked, owner-only, and deletable', async () => {
  const api = await startApi({ retentionMs: -1 });
  try {
    const ada = await register(api.base, 'ada@example.com');
    const grace = await register(api.base, 'grace@example.com');
    const blocked = await fetch(`${api.base}/api/media`, {
      method: 'POST',
      headers: authHeaders(ada.cookie, ada.body.csrfToken),
      body: JSON.stringify({ purpose: 'wardrobe', imageBase64: jpeg }),
    });
    assert.equal(blocked.status, 403);
    assert.equal((await blocked.json() as { code: string }).code, 'private_photo_consent_required');

    await grantStorage(api.base, ada.cookie, ada.body.csrfToken);
    await grantStorage(api.base, grace.cookie, grace.body.csrfToken);

    const rejected = await fetch(`${api.base}/api/media`, {
      method: 'POST',
      headers: authHeaders(ada.cookie, ada.body.csrfToken),
      body: JSON.stringify({ purpose: 'wardrobe', imageBase64: Buffer.from('not an image').toString('base64') }),
    });
    assert.equal(rejected.status, 400);
    const child = await fetch(`${api.base}/api/media`, {
      method: 'POST',
      headers: authHeaders(ada.cookie, ada.body.csrfToken),
      body: JSON.stringify({ purpose: 'child_photo', imageBase64: jpeg }),
    });
    assert.equal(child.status, 403);
    const uploaded = await fetch(`${api.base}/api/media`, {
      method: 'POST',
      headers: authHeaders(ada.cookie, ada.body.csrfToken),
      body: JSON.stringify({ purpose: 'wardrobe', imageBase64: jpeg }),
    });
    const media = await uploaded.json() as { id: string; contentType: string };
    assert.equal(uploaded.status, 201);
    assert.equal(media.contentType, 'image/jpeg');
    assert.equal(media.id.includes('.jpg'), false);
    const stolen = await fetch(`${api.base}/api/media/${media.id}`, { headers: { cookie: grace.cookie } });
    assert.equal(stolen.status, 404);
    const owned = await fetch(`${api.base}/api/media/${media.id}`, { headers: { cookie: ada.cookie } });
    assert.equal(owned.status, 200);
    assert.equal(owned.headers.get('content-type'), 'image/jpeg');
    const removed = await fetch(`${api.base}/api/media/${media.id}`, {
      method: 'DELETE',
      headers: authHeaders(ada.cookie, ada.body.csrfToken),
    });
    assert.equal(removed.status, 200);
    const gone = await fetch(`${api.base}/api/media/${media.id}`, { headers: { cookie: ada.cookie } });
    assert.equal(gone.status, 404);
    const again = await fetch(`${api.base}/api/media`, {
      method: 'POST',
      headers: authHeaders(ada.cookie, ada.body.csrfToken),
      body: JSON.stringify({ purpose: 'profile', imageBase64: jpeg }),
    });
    const second = await again.json() as { id: string };
    assert.equal(again.status, 201);

    const graceUpload = await fetch(`${api.base}/api/media`, {
      method: 'POST',
      headers: authHeaders(grace.cookie, grace.body.csrfToken),
      body: JSON.stringify({ purpose: 'wardrobe', imageBase64: jpeg }),
    });
    const graceMedia = await graceUpload.json() as { id: string };
    assert.equal(graceUpload.status, 201);

    const cleaned = await fetch(`${api.base}/api/media/cleanup`, {
      method: 'POST',
      headers: authHeaders(ada.cookie, ada.body.csrfToken),
    });
    const cleanup = await cleaned.json() as { removed: number };
    assert.equal(cleanup.removed >= 1, true);
    const expired = await fetch(`${api.base}/api/media/${second.id}`, { headers: { cookie: ada.cookie } });
    assert.equal(expired.status, 404);
    const graceStill = await fetch(`${api.base}/api/media/${graceMedia.id}`, { headers: { cookie: grace.cookie } });
    assert.equal(graceStill.status, 200);
  } finally {
    await api.close();
  }
});
