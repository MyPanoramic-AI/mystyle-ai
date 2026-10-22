import assert from 'node:assert/strict';
import test from 'node:test';
import { authHeaders, register, startApi } from './harness.js';

const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xd9]).toString('base64');
const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]).toString('base64');

async function grantStorage(base: string, cookie: string, csrf: string): Promise<void> {
  const response = await fetch(`${base}/api/privacy/consent`, {
    method: 'POST',
    headers: authHeaders(cookie, csrf),
    body: JSON.stringify({ purpose: 'private_photo_storage', granted: true, captureMethod: 'settings_toggle' }),
  });
  assert.equal(response.status, 200);
}

test('profile photograph slots require storage consent and stay owner-only', async () => {
  const api = await startApi();
  try {
    const ada = await register(api.base, 'photo-ada@example.com');
    const grace = await register(api.base, 'photo-grace@example.com');
    const blocked = await fetch(`${api.base}/api/profile/photos/portrait`, {
      method: 'PUT',
      headers: authHeaders(ada.cookie, ada.body.csrfToken),
      body: JSON.stringify({ imageBase64: jpeg }),
    });
    assert.equal(blocked.status, 403);
    assert.equal((await blocked.json() as { code: string }).code, 'private_photo_consent_required');

    await grantStorage(api.base, ada.cookie, ada.body.csrfToken);
    const uploaded = await fetch(`${api.base}/api/profile/photos/portrait`, {
      method: 'PUT',
      headers: authHeaders(ada.cookie, ada.body.csrfToken),
      body: JSON.stringify({ imageBase64: jpeg }),
    });
    const first = await uploaded.json() as { mediaId: string };
    assert.equal(uploaded.status, 201);

    const profile = await fetch(`${api.base}/api/profile`, { headers: { cookie: ada.cookie } });
    const body = await profile.json() as { photos: { portraitMediaId: string | null } };
    assert.equal(body.photos.portraitMediaId, first.mediaId);

    const stolen = await fetch(`${api.base}/api/media/${first.mediaId}`, { headers: { cookie: grace.cookie } });
    assert.equal(stolen.status, 404);

    const owned = await fetch(`${api.base}/api/media/${first.mediaId}`, { headers: { cookie: ada.cookie } });
    assert.equal(owned.status, 200);

    const replaced = await fetch(`${api.base}/api/profile/photos/portrait`, {
      method: 'PUT',
      headers: authHeaders(ada.cookie, ada.body.csrfToken),
      body: JSON.stringify({ imageBase64: png }),
    });
    const second = await replaced.json() as { mediaId: string; previousMediaId: string | null };
    assert.equal(replaced.status, 201);
    assert.equal(second.previousMediaId, first.mediaId);
    assert.notEqual(second.mediaId, first.mediaId);
    const gone = await fetch(`${api.base}/api/media/${first.mediaId}`, { headers: { cookie: ada.cookie } });
    assert.equal(gone.status, 404);

    await fetch(`${api.base}/api/profile/photos/full_body_front`, {
      method: 'PUT',
      headers: authHeaders(ada.cookie, ada.body.csrfToken),
      body: JSON.stringify({ imageBase64: jpeg }),
    });
    await fetch(`${api.base}/api/profile/photos/full_body_additional`, {
      method: 'PUT',
      headers: authHeaders(ada.cookie, ada.body.csrfToken),
      body: JSON.stringify({ imageBase64: jpeg }),
    });
    const slots = await fetch(`${api.base}/api/profile/photos`, { headers: { cookie: ada.cookie } });
    const listed = await slots.json() as { photos: { portraitMediaId: string; fullBodyFrontMediaId: string; fullBodyAdditionalMediaId: string } };
    assert.ok(listed.photos.portraitMediaId);
    assert.ok(listed.photos.fullBodyFrontMediaId);
    assert.ok(listed.photos.fullBodyAdditionalMediaId);

    const removed = await fetch(`${api.base}/api/profile/photos/full_body_additional`, {
      method: 'DELETE',
      headers: authHeaders(ada.cookie, ada.body.csrfToken),
    });
    assert.equal(removed.status, 200);
    const after = await fetch(`${api.base}/api/profile/photos`, { headers: { cookie: ada.cookie } });
    assert.equal((await after.json() as { photos: { fullBodyAdditionalMediaId: string | null } }).photos.fullBodyAdditionalMediaId, null);

    const child = await fetch(`${api.base}/api/media`, {
      method: 'POST',
      headers: authHeaders(ada.cookie, ada.body.csrfToken),
      body: JSON.stringify({ purpose: 'child_portrait', imageBase64: jpeg }),
    });
    assert.equal(child.status, 403);

    const exportJob = await fetch(`${api.base}/api/privacy/export`, {
      method: 'POST',
      headers: authHeaders(ada.cookie, ada.body.csrfToken),
      body: JSON.stringify({ password: 'correct-horse-12' }),
    });
    assert.equal(exportJob.status, 201);
    const exportBody = await exportJob.json() as { exportId: string };
    const download = await fetch(`${api.base}/api/privacy/export/${exportBody.exportId}/download`, {
      headers: { cookie: ada.cookie },
    });
    assert.equal(download.status, 200);
  } finally {
    await api.close();
  }
});

test('saved demonstration products persist per account without duplicates', async () => {
  const api = await startApi();
  try {
    const ada = await register(api.base, 'wish-ada@example.com');
    const grace = await register(api.base, 'wish-grace@example.com');
    const headers = authHeaders(ada.cookie, ada.body.csrfToken);
    const saved = await fetch(`${api.base}/api/saved-products`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ retailerSource: 'mystyle_demo_catalogue', externalProductId: 'prod-cream-sculptural-blazer' }),
    });
    const first = await saved.json() as { id: string; demonstration: boolean; duplicate?: boolean };
    assert.equal(saved.status, 201);
    assert.equal(first.demonstration, true);
    const again = await fetch(`${api.base}/api/saved-products`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ retailerSource: 'mystyle_demo_catalogue', externalProductId: 'prod-cream-sculptural-blazer' }),
    });
    const duplicate = await again.json() as { id: string; duplicate?: boolean };
    assert.equal(duplicate.id, first.id);
    assert.equal(duplicate.duplicate, true);
    const listed = await fetch(`${api.base}/api/saved-products`, { headers: { cookie: ada.cookie } });
    const products = await listed.json() as { products: { id: string }[] };
    assert.equal(products.products.length, 1);
    const foreign = await fetch(`${api.base}/api/saved-products`, { headers: { cookie: grace.cookie } });
    assert.equal((await foreign.json() as { products: unknown[] }).products.length, 0);
    const removed = await fetch(`${api.base}/api/saved-products/${first.id}`, {
      method: 'DELETE',
      headers,
    });
    assert.equal(removed.status, 200);
  } finally {
    await api.close();
  }
});
