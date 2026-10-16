import assert from 'node:assert/strict';
import test from 'node:test';
import { authHeaders, register, startApi } from './harness.js';

test('one account cannot read or change another account', async () => {
  const api = await startApi();
  try {
    const ada = await register(api.base, 'ada@example.com');
    const grace = await register(api.base, 'grace@example.com');
    const created = await fetch(`${api.base}/api/wardrobe`, {
      method: 'POST',
      headers: authHeaders(ada.cookie, ada.body.csrfToken),
      body: JSON.stringify({ name: 'Navy blazer', category: 'outerwear' }),
    });
    const item = await created.json() as { id: string };
    assert.equal(created.status, 201);
    const hidden = await fetch(`${api.base}/api/wardrobe/${item.id}`, { headers: { cookie: grace.cookie } });
    assert.equal(hidden.status, 404);
    const look = await fetch(`${api.base}/api/looks`, {
      method: 'POST',
      headers: authHeaders(grace.cookie, grace.body.csrfToken),
      body: JSON.stringify({ title: 'Borrowed', wardrobeItemIds: [item.id] }),
    });
    assert.equal(look.status, 404);
    const member = await fetch(`${api.base}/api/family`, {
      method: 'POST',
      headers: authHeaders(ada.cookie, ada.body.csrfToken),
      body: JSON.stringify({ displayName: 'Family adult', memberKind: 'adult', permissionLevel: 'editor' }),
    });
    const family = await member.json() as { id: string };
    const otherFamily = await fetch(`${api.base}/api/family/${family.id}`, { headers: { cookie: grace.cookie } });
    assert.equal(otherFamily.status, 404);
    const dependent = await fetch(`${api.base}/api/family`, {
      method: 'POST',
      headers: authHeaders(ada.cookie, ada.body.csrfToken),
      body: JSON.stringify({ displayName: 'Dependent', memberKind: 'dependent', permissionLevel: 'editor' }),
    });
    assert.equal(dependent.status, 400);
    const product = await fetch(`${api.base}/api/saved-products`, {
      method: 'POST',
      headers: authHeaders(ada.cookie, ada.body.csrfToken),
      body: JSON.stringify({ retailerSource: 'demo-atelier', externalProductId: 'DEMO-1' }),
    });
    const saved = await product.json() as { id: string };
    const removed = await fetch(`${api.base}/api/saved-products/${saved.id}`, {
      method: 'DELETE',
      headers: authHeaders(grace.cookie, grace.body.csrfToken),
    });
    assert.equal(removed.status, 404);
  } finally {
    await api.close();
  }
});
