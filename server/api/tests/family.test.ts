import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { loadConfig } from '../src/config.js';
import { migrate, openDatabase } from '../src/db.js';
import { createFamilyMember, listFamily } from '../src/domain/family.js';
import { familyPlanningBoundary, splitBudgetCents } from '../src/domain/familyPlans.js';
import { authHeaders, register, startApi } from './harness.js';

test('family profiles and event plans stay with the owning account', async () => {
  const api = await startApi({ sessionMs: 60_000 });
  try {
    const ada = await register(api.base, 'ada-family@example.com');
    const signedOut = await fetch(`${api.base}/api/family`);
    assert.equal(signedOut.status, 401);
    const grace = await register(api.base, 'grace-family@example.com');
    const missingToken = await fetch(`${api.base}/api/family`, {
      method: 'POST',
      headers: { cookie: ada.cookie, 'content-type': 'application/json' },
      body: JSON.stringify({ displayName: 'No token', memberKind: 'adult' }),
    });
    assert.equal(missingToken.status, 403);
    const photo = await fetch(`${api.base}/api/family`, {
      method: 'POST',
      headers: authHeaders(ada.cookie, ada.body.csrfToken),
      body: JSON.stringify({ displayName: 'Photo', memberKind: 'dependent', mediaId: 'picture' }),
    });
    assert.equal(photo.status, 400);
    const adult = await fetch(`${api.base}/api/family`, {
      method: 'POST',
      headers: authHeaders(ada.cookie, ada.body.csrfToken),
      body: JSON.stringify({
        displayName: 'Sam', memberKind: 'adult', relationshipLabel: 'Partner / Spouse',
        styles: ['Classic'], colours: ['Navy'], budgetCents: 150000, sizes: { tops: 'M' },
      }),
    });
    const sam = await adult.json() as { id: string; permissionLevel: string; canAuthenticate: boolean };
    assert.equal(adult.status, 201);
    assert.equal(sam.canAuthenticate, false);
    const edited = await fetch(`${api.base}/api/family/${sam.id}`, {
      method: 'PATCH',
      headers: authHeaders(ada.cookie, ada.body.csrfToken),
      body: JSON.stringify({ colours: ['Navy', 'Ivory'] }),
    });
    const editedBody = await edited.json() as { colours: string[] };
    assert.deepEqual(editedBody.colours, ['Navy', 'Ivory']);
    const child = await fetch(`${api.base}/api/family`, {
      method: 'POST',
      headers: authHeaders(ada.cookie, ada.body.csrfToken),
      body: JSON.stringify({ displayName: 'Alex', memberKind: 'dependent', relationshipLabel: 'Child', permissionLevel: 'viewer', colours: ['Ivory'] }),
    });
    const alex = await child.json() as { id: string; permissionLevel: string };
    assert.equal(child.status, 201);
    assert.equal(alex.permissionLevel, 'viewer');
    const promoted = await fetch(`${api.base}/api/family/${alex.id}`, {
      method: 'PATCH',
      headers: authHeaders(ada.cookie, ada.body.csrfToken),
      body: JSON.stringify({ permissionLevel: 'editor' }),
    });
    assert.equal(promoted.status, 400);
    const hidden = await fetch(`${api.base}/api/family/${sam.id}`, { headers: { cookie: grace.cookie } });
    assert.equal(hidden.status, 404);
    const graceItem = await fetch(`${api.base}/api/wardrobe`, {
      method: 'POST',
      headers: authHeaders(grace.cookie, grace.body.csrfToken),
      body: JSON.stringify({ name: 'Borrowed jacket', category: 'outerwear' }),
    });
    const jacket = await graceItem.json() as { id: string };
    const injected = await fetch(`${api.base}/api/family-events`, {
      method: 'POST',
      headers: authHeaders(ada.cookie, ada.body.csrfToken),
      body: JSON.stringify({
        title: 'Wedding', occasion: 'Wedding', eventDate: '2026-11-07', totalBudgetCents: 300000,
        participants: [{ memberId: sam.id, wardrobeItemId: jacket.id }],
      }),
    });
    assert.equal(injected.status, 404);
    const foreignMember = await fetch(`${api.base}/api/family-events`, {
      method: 'POST',
      headers: authHeaders(ada.cookie, ada.body.csrfToken),
      body: JSON.stringify({ title: 'Dinner', occasion: 'Dinner', totalBudgetCents: 1000, participants: [{ memberId: 'not-ada' }] }),
    });
    assert.equal(foreignMember.status, 404);
    const badMoney = await fetch(`${api.base}/api/family-events`, {
      method: 'POST',
      headers: authHeaders(ada.cookie, ada.body.csrfToken),
      body: JSON.stringify({ title: 'Dinner', occasion: 'Dinner', totalBudgetCents: 10.5, participants: [{ memberId: sam.id }] }),
    });
    assert.equal(badMoney.status, 400);
    const event = await fetch(`${api.base}/api/family-events`, {
      method: 'POST',
      headers: authHeaders(ada.cookie, ada.body.csrfToken),
      body: JSON.stringify({
        title: 'Family wedding', occasion: 'Wedding', eventDate: '2026-11-07', totalBudgetCents: 300000,
        colourTheme: { name: 'Navy and ivory' }, notes: 'Planned amounts only',
        participants: [{ memberId: 'self', outfitNote: 'Navy dress' }, { memberId: sam.id, outfitNote: 'Navy jacket' }, { memberId: alex.id, outfitNote: 'Ivory shirt' }],
      }),
    });
    const plan = await event.json() as { id: string; participants: { allocatedBudgetCents: number }[]; plannedOnly: boolean };
    assert.equal(event.status, 201);
    assert.equal(plan.plannedOnly, true);
    assert.equal(plan.participants.reduce((sum, row) => sum + row.allocatedBudgetCents, 0), 300000);
    const moved = await fetch(`${api.base}/api/family-events/${plan.id}`, {
      method: 'PATCH',
      headers: authHeaders(ada.cookie, ada.body.csrfToken),
      body: JSON.stringify({ eventDate: '2026-11-08', status: 'ready' }),
    });
    assert.equal(moved.status, 200);
    const otherDelete = await fetch(`${api.base}/api/family/${sam.id}`, { method: 'DELETE', headers: authHeaders(grace.cookie, grace.body.csrfToken) });
    assert.equal(otherDelete.status, 404);
    const removedMember = await fetch(`${api.base}/api/family/${alex.id}`, { method: 'DELETE', headers: authHeaders(ada.cookie, ada.body.csrfToken) });
    assert.equal(removedMember.status, 200);
    const after = await fetch(`${api.base}/api/family-events/${plan.id}`, { headers: { cookie: ada.cookie } });
    const remaining = await after.json() as { participants: { memberId: string }[] };
    assert.equal(remaining.participants.some((row) => row.memberId === alex.id), false);
    assert.equal(remaining.participants.some((row) => row.memberId === sam.id), true);
    api.clock.value += 60_000;
    const expired = await fetch(`${api.base}/api/family`, { headers: { cookie: ada.cookie } });
    assert.equal(expired.status, 401);
    const imported = await fetch(`${api.base}/api/family/import`, { method: 'POST', headers: authHeaders(ada.cookie, ada.body.csrfToken), body: '{}' });
    assert.equal(imported.status, 404);
  } finally {
    await api.close();
  }
});

test('a family profile survives reopening the database and dependents stay out of the AI boundary', () => {
  assert.deepEqual(splitBudgetCents(100, 3), [34, 33, 33]);
  const dir = mkdtempSync(path.join(tmpdir(), 'mystyle-family-'));
  const file = path.join(dir, 'account.sqlite');
  const first = openDatabase(file);
  migrate(first, loadConfig().migrationsDir);
  const created = createFamilyMember(first, 'ada', { displayName: 'Sam', memberKind: 'adult' }, Date.parse('2026-10-20T00:00:00Z'));
  createFamilyMember(first, 'ada', { displayName: 'Alex', memberKind: 'dependent' }, Date.parse('2026-10-20T00:00:00Z'));
  first.close();
  const second = openDatabase(file);
  const rows = listFamily(second, 'ada') as { id: string; displayName: string; memberKind: string }[];
  assert.equal(rows.some((row) => row.id === created.id), true);
  const boundary = familyPlanningBoundary(rows);
  assert.equal(boundary.externalTransmission, 'disabled');
  assert.equal(boundary.dependentsIncluded, false);
  assert.equal(boundary.adultProfiles.some((profile) => profile.displayName === 'Alex'), false);
  assert.equal(listFamily(second, 'grace').length, 0);
  second.close();
});
