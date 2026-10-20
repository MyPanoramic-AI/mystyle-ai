import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { loadConfig } from '../src/config.js';
import { migrate, openDatabase } from '../src/db.js';
import { createBeautyLook, listBeautyLooks } from '../src/domain/beauty.js';
import { beautyGenerationBoundary } from '../src/domain/beautyBoundary.js';
import { integrationBoundaries } from '../src/integrations.js';
import { authHeaders, register, startApi } from './harness.js';

test('beauty preferences and looks stay with the owning account', async () => {
  const api = await startApi({ sessionMs: 60_000 });
  try {
    const ada = await register(api.base, 'ada-beauty@example.com');
    const grace = await register(api.base, 'grace-beauty@example.com');
    const signedOut = await fetch(`${api.base}/api/beauty-looks`);
    assert.equal(signedOut.status, 401);
    const missingToken = await fetch(`${api.base}/api/beauty-preferences`, {
      method: 'PUT',
      headers: { cookie: ada.cookie, 'content-type': 'application/json' },
      body: JSON.stringify({ makeupStyles: ['natural'] }),
    });
    assert.equal(missingToken.status, 403);
    const photo = await fetch(`${api.base}/api/beauty-looks`, {
      method: 'POST',
      headers: authHeaders(ada.cookie, ada.body.csrfToken),
      body: JSON.stringify({ category: 'makeup', title: 'Face', imageBase64: 'abc' }),
    });
    assert.equal(photo.status, 400);
    const preferences = await fetch(`${api.base}/api/beauty-preferences`, {
      method: 'PUT',
      headers: authHeaders(ada.cookie, ada.body.csrfToken),
      body: JSON.stringify({ makeupStyles: ['natural-glow'], nailStyles: ['nude'], nailColours: ['Nude'], budgetMinCents: 0, budgetMaxCents: 80000 }),
    });
    const savedPreferences = await preferences.json() as { makeupStyles: string[]; generation: string };
    assert.equal(preferences.status, 200);
    assert.deepEqual(savedPreferences.makeupStyles, ['natural-glow']);
    assert.equal(savedPreferences.generation, 'not_connected');
    const hair = await fetch(`${api.base}/api/beauty-looks`, {
      method: 'POST',
      headers: authHeaders(ada.cookie, ada.body.csrfToken),
      body: JSON.stringify({ category: 'hairstyles', title: 'Soft waves', styleLabel: 'wavy', occasion: 'Wedding', sourceKey: 'hair-soft-waves', sourceLabel: 'Editorial inspiration', imageUrl: 'https://images.unsplash.com/photo-1' }),
    });
    const hairBody = await hair.json() as { id: string; previewAvailable: boolean };
    assert.equal(hair.status, 201);
    assert.equal(hairBody.previewAvailable, false);
    const duplicate = await fetch(`${api.base}/api/beauty-looks`, {
      method: 'POST',
      headers: authHeaders(ada.cookie, ada.body.csrfToken),
      body: JSON.stringify({ category: 'hairstyles', title: 'Soft waves', sourceKey: 'hair-soft-waves' }),
    });
    assert.equal(duplicate.status, 409);
    const makeup = await fetch(`${api.base}/api/beauty-looks`, {
      method: 'POST',
      headers: authHeaders(ada.cookie, ada.body.csrfToken),
      body: JSON.stringify({ category: 'makeup', title: 'Natural evening glam', styleLabel: 'soft-glam', sourceKey: 'makeup-glam' }),
    });
    assert.equal(makeup.status, 201);
    const nails = await fetch(`${api.base}/api/beauty-looks`, {
      method: 'POST',
      headers: authHeaders(ada.cookie, ada.body.csrfToken),
      body: JSON.stringify({ category: 'nails', title: 'Nude almond', styleLabel: 'almond', colourLabel: 'Nude', sourceKey: 'nails-nude' }),
    });
    assert.equal(nails.status, 201);
    const complete = await fetch(`${api.base}/api/beauty-looks`, {
      method: 'POST',
      headers: authHeaders(ada.cookie, ada.body.csrfToken),
      body: JSON.stringify({
        category: 'complete-looks', title: 'Wedding Guest Look', occasion: 'Wedding', notes: 'Planned selection',
        parts: [
          { kind: 'hairstyle', title: 'Soft waves' },
          { kind: 'hair-colour', title: 'Warm brunette' },
          { kind: 'makeup', title: 'Natural evening glam' },
          { kind: 'nails', title: 'Nude almond' },
        ],
      }),
    });
    const look = await complete.json() as { id: string; parts: { title: string }[] };
    assert.equal(complete.status, 201);
    assert.equal(look.parts.length, 4);
    const edited = await fetch(`${api.base}/api/beauty-looks/${look.id}`, {
      method: 'PATCH',
      headers: authHeaders(ada.cookie, ada.body.csrfToken),
      body: JSON.stringify({ notes: 'Rose makeup' }),
    });
    assert.equal(edited.status, 200);
    const outfit = await fetch(`${api.base}/api/looks`, {
      method: 'POST',
      headers: authHeaders(ada.cookie, ada.body.csrfToken),
      body: JSON.stringify({ title: 'Black evening dress' }),
    });
    const dress = await outfit.json() as { id: string };
    const graceOutfit = await fetch(`${api.base}/api/looks`, {
      method: 'POST',
      headers: authHeaders(grace.cookie, grace.body.csrfToken),
      body: JSON.stringify({ title: 'Borrowed dress' }),
    });
    const borrowed = await graceOutfit.json() as { id: string };
    const foreign = await fetch(`${api.base}/api/beauty-looks/${look.id}/links`, {
      method: 'POST',
      headers: authHeaders(ada.cookie, ada.body.csrfToken),
      body: JSON.stringify({ outfitId: borrowed.id }),
    });
    assert.equal(foreign.status, 404);
    const linked = await fetch(`${api.base}/api/beauty-looks/${look.id}/links`, {
      method: 'POST',
      headers: authHeaders(ada.cookie, ada.body.csrfToken),
      body: JSON.stringify({ outfitId: dress.id }),
    });
    const linkedBody = await linked.json() as { links: { id: string; outfitId: string }[] };
    assert.equal(linked.status, 201);
    assert.equal(linkedBody.links[0]?.outfitId, dress.id);
    const hidden = await fetch(`${api.base}/api/beauty-looks/${look.id}`, { headers: { cookie: grace.cookie } });
    assert.equal(hidden.status, 404);
    const hiddenWrite = await fetch(`${api.base}/api/beauty-looks/${look.id}`, {
      method: 'PATCH',
      headers: authHeaders(grace.cookie, grace.body.csrfToken),
      body: JSON.stringify({ title: 'Taken' }),
    });
    assert.equal(hiddenWrite.status, 404);
    const filtered = await fetch(`${api.base}/api/beauty-looks?category=makeup&q=glam`, { headers: { cookie: ada.cookie } });
    const filteredBody = await filtered.json() as { looks: { title: string }[] };
    assert.equal(filteredBody.looks.length, 1);
    const removed = await fetch(`${api.base}/api/beauty-looks/${hairBody.id}`, { method: 'DELETE', headers: authHeaders(ada.cookie, ada.body.csrfToken) });
    assert.equal(removed.status, 200);
    const imported = await fetch(`${api.base}/api/beauty/import`, { method: 'POST', headers: authHeaders(ada.cookie, ada.body.csrfToken), body: '{}' });
    assert.equal(imported.status, 404);
    api.clock.value += 60_000;
    const expired = await fetch(`${api.base}/api/beauty-looks`, { headers: { cookie: ada.cookie } });
    assert.equal(expired.status, 401);
    assert.equal(integrationBoundaries.beauty.status, 'not_connected');
    assert.equal(beautyGenerationBoundary().imageGeneration, 'not_connected');
    assert.equal(beautyGenerationBoundary().photographsAccepted, false);
  } finally {
    await api.close();
  }
});

test('a beauty look survives reopening the database and stays out of another account', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'mystyle-beauty-'));
  const file = path.join(dir, 'account.sqlite');
  const first = openDatabase(file);
  migrate(first, loadConfig().migrationsDir);
  const created = createBeautyLook(first, 'ada', { category: 'nails', title: 'Nude almond', sourceKey: 'nails-nude' }, Date.parse('2026-10-20T00:00:00Z'));
  first.close();
  const second = openDatabase(file);
  const rows = listBeautyLooks(second, 'ada', {});
  assert.equal(rows.some((row) => row.id === created.id), true);
  assert.equal(listBeautyLooks(second, 'grace', {}).length, 0);
  second.close();
});
