import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { loadConfig } from '../src/config.js';
import { migrate, openDatabase } from '../src/db.js';
import { createWardrobeItem, listWardrobe } from '../src/domain/collections.js';
import { authorisedWardrobe } from '../src/domain/wardrobeContext.js';
import { authHeaders, register, startApi } from './harness.js';

const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xd9]).toString('base64');

async function bodyOf<T>(response: Response, status: number): Promise<T> {
  const text = await response.text();
  if (response.status !== status) throw new Error(`${response.status} ${text.slice(0, 240)}`);
  return JSON.parse(text) as T;
}

test('wardrobe items, outfits, and plans persist for the owner only', async () => {
  const api = await startApi({ sessionMs: 60_000 });
  try {
    const ada = await register(api.base, 'ada-wardrobe@example.com');
    const grace = await register(api.base, 'grace-wardrobe@example.com');
    const invalid = await fetch(`${api.base}/api/wardrobe`, {
      method: 'POST',
      headers: authHeaders(ada.cookie, ada.body.csrfToken),
      body: JSON.stringify({ name: '', category: 'tops' }),
    });
    assert.equal(invalid.status, 400);
    const consent = await fetch(`${api.base}/api/privacy/consent`, {
      method: 'POST',
      headers: authHeaders(ada.cookie, ada.body.csrfToken),
      body: JSON.stringify({ purpose: 'private_photo_storage', granted: true, captureMethod: 'settings_toggle' }),
    });
    assert.equal(consent.status, 200);
    const photo = await fetch(`${api.base}/api/media`, {
      method: 'POST',
      headers: authHeaders(ada.cookie, ada.body.csrfToken),
      body: JSON.stringify({ purpose: 'wardrobe', imageBase64: jpeg }),
    });
    const media = await bodyOf<{ id: string }>(photo, 201);
    assert.equal(photo.status, 201);
    const created = await fetch(`${api.base}/api/wardrobe`, {
      method: 'POST',
      headers: authHeaders(ada.cookie, ada.body.csrfToken),
      body: JSON.stringify({
        name: 'Navy shirt', category: 'tops', colour: 'navy', colourHex: '#1B2A4A', sizeLabel: 'M', brand: 'Studio',
        subcategory: 'Shirt', seasons: ['all-season'], occasions: ['work'], mediaId: media.id, imageUrl: 'data:image/jpeg;base64,abc',
      }),
    });
    assert.equal(created.status, 400);
    const saved = await fetch(`${api.base}/api/wardrobe`, {
      method: 'POST',
      headers: authHeaders(ada.cookie, ada.body.csrfToken),
      body: JSON.stringify({
        name: 'Navy shirt', category: 'tops', colour: 'navy', sizeLabel: 'M', brand: 'Studio', subcategory: 'Shirt',
        seasons: ['all-season'], occasions: ['work'], mediaId: media.id, notes: 'Breathable',
      }),
    });
    const item = await bodyOf<{ id: string; mediaId: string; brand: string }>(saved, 201);
    assert.equal(saved.status, 201);
    assert.equal(item.mediaId, media.id);
    const edited = await fetch(`${api.base}/api/wardrobe/${item.id}`, {
      method: 'PATCH',
      headers: authHeaders(ada.cookie, ada.body.csrfToken),
      body: JSON.stringify({ colour: 'ink' }),
    });
    const editedBody = await bodyOf<{ colour: string }>(edited, 200);
    assert.equal(edited.status, 200);
    assert.equal(editedBody.colour, 'ink');
    const hiddenPhoto = await fetch(`${api.base}/api/media/${media.id}`, { headers: { cookie: grace.cookie } });
    assert.equal(hiddenPhoto.status, 404);
    const outfit = await fetch(`${api.base}/api/looks`, {
      method: 'POST',
      headers: authHeaders(ada.cookie, ada.body.csrfToken),
      body: JSON.stringify({ title: 'Work day', kind: 'wardrobe_outfit', occasion: 'work', wardrobeItemIds: [item.id], slots: { topId: item.id } }),
    });
    const look = await bodyOf<{ id: string }>(outfit, 201);
    assert.equal(outfit.status, 201);
    const renamed = await fetch(`${api.base}/api/looks/${look.id}`, {
      method: 'PATCH',
      headers: authHeaders(ada.cookie, ada.body.csrfToken),
      body: JSON.stringify({ title: 'Office day' }),
    });
    assert.equal(renamed.status, 200);
    const otherOutfit = await fetch(`${api.base}/api/looks/${look.id}`, { headers: { cookie: grace.cookie } });
    assert.equal(otherOutfit.status, 404);
    const plan = await fetch(`${api.base}/api/outfit-plans`, {
      method: 'POST',
      headers: authHeaders(ada.cookie, ada.body.csrfToken),
      body: JSON.stringify({ title: 'Friday dinner', planDate: '2026-11-07', occasion: 'evening', outfitId: look.id, notes: 'No bright orange' }),
    });
    const scheduled = await bodyOf<{ id: string; outfitId: string }>(plan, 201);
    assert.equal(plan.status, 201);
    assert.equal(scheduled.outfitId, look.id);
    const moved = await fetch(`${api.base}/api/outfit-plans/${scheduled.id}`, {
      method: 'PATCH',
      headers: authHeaders(ada.cookie, ada.body.csrfToken),
      body: JSON.stringify({ planDate: '2026-11-08' }),
    });
    assert.equal(moved.status, 200);
    const stolen = await fetch(`${api.base}/api/outfit-plans/${scheduled.id}`, {
      method: 'DELETE',
      headers: authHeaders(grace.cookie, grace.body.csrfToken),
    });
    assert.equal(stolen.status, 404);
    const inspiration = await fetch(`${api.base}/api/looks`, {
      method: 'POST',
      headers: authHeaders(ada.cookie, ada.body.csrfToken),
      body: JSON.stringify({ title: 'Parisian', kind: 'inspiration', sourceKey: 'look-parisian-chic' }),
    });
    const again = await fetch(`${api.base}/api/looks`, {
      method: 'POST',
      headers: authHeaders(ada.cookie, ada.body.csrfToken),
      body: JSON.stringify({ title: 'Parisian', kind: 'inspiration', sourceKey: 'look-parisian-chic' }),
    });
    const firstSaved = await bodyOf<{ id: string }>(inspiration, 201);
    const secondSaved = await bodyOf<{ id: string; duplicate: boolean }>(again, 200);
    assert.equal(secondSaved.id, firstSaved.id);
    assert.equal(secondSaved.duplicate, true);
    const removedItem = await fetch(`${api.base}/api/wardrobe/${item.id}`, {
      method: 'DELETE',
      headers: authHeaders(ada.cookie, ada.body.csrfToken),
    });
    assert.equal(removedItem.status, 200);
    const afterDelete = await fetch(`${api.base}/api/looks/${look.id}`, { headers: { cookie: ada.cookie } });
    const remaining = await bodyOf<{ wardrobeItemIds: string[]; slots: { topId?: string } }>(afterDelete, 200);
    assert.deepEqual(remaining.wardrobeItemIds, []);
    assert.equal(remaining.slots.topId, item.id);
    const removedLook = await fetch(`${api.base}/api/looks/${look.id}`, {
      method: 'DELETE',
      headers: authHeaders(ada.cookie, ada.body.csrfToken),
    });
    assert.equal(removedLook.status, 200);
    const cleared = await fetch(`${api.base}/api/outfit-plans/${scheduled.id}`, { headers: { cookie: ada.cookie } });
    const clearedPlan = await bodyOf<{ outfitId: string | null }>(cleared, 200);
    assert.equal(clearedPlan.outfitId, null);
    await fetch(`${api.base}/api/outfit-plans/${scheduled.id}`, { method: 'DELETE', headers: authHeaders(ada.cookie, ada.body.csrfToken) });
    api.clock.value += 60_000;
    const expired = await fetch(`${api.base}/api/wardrobe`, { headers: { cookie: ada.cookie } });
    assert.equal(expired.status, 401);
  } finally {
    await api.close();
  }
});

test('a wardrobe row survives reopening the database and stays out of another account', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'mystyle-wardrobe-'));
  const file = path.join(dir, 'account.sqlite');
  const config = loadConfig();
  const first = openDatabase(file);
  migrate(first, config.migrationsDir);
  const created = createWardrobeItem(first, 'ada', { name: 'Black trousers', category: 'bottoms', colour: 'black' }, Date.parse('2026-10-20T00:00:00Z'));
  first.close();
  const second = openDatabase(file);
  const ada = listWardrobe(second, 'ada');
  const grace = authorisedWardrobe(second, 'grace');
  assert.equal(ada.length, 1);
  assert.equal(ada[0]?.id, created.id);
  assert.equal(grace.length, 0);
  assert.equal(JSON.stringify(authorisedWardrobe(second, 'ada')).includes('media'), false);
  second.close();
});

test('multi-colour wardrobe labels are accepted within the expanded colour limit', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'mystyle-wardrobe-colours-'));
  const file = path.join(dir, 'account.sqlite');
  const config = loadConfig();
  const db = openDatabase(file);
  migrate(db, config.migrationsDir);
  const colour = 'Navy Midnight, Ivory Cream, Camel Tan, Forest Pine, Soft Blush';
  assert.ok(colour.length > 40);
  const created = createWardrobeItem(db, 'ada', {
    name: 'Printed blouse',
    category: 'tops',
    colour,
    colourHex: '#1D2A44',
  }, Date.parse('2026-10-26T00:00:00Z'));
  assert.equal(created.colour, colour);
  db.close();
});
