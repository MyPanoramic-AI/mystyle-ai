import assert from 'node:assert/strict';
import test from 'node:test';
import { authHeaders, register, startApi } from './harness.js';
import { resolveStarterStyleKey, starterBasicsForStyles } from '../src/domain/wardrobeBasics.js';

test('each known style resolves to exactly 10 starter basics', () => {
  const styles = [
    'Classic & Elegant',
    'Modern & Minimal',
    'Casual & Comfortable',
    'Trendy & Bold',
    'Smart & Professional',
    'Romantic & Feminine',
    'Sporty & Active',
    'Chic & Sophisticated',
  ];
  for (const style of styles) {
    const basics = starterBasicsForStyles([style]);
    assert.equal(basics.length, 10, style);
    assert.equal(new Set(basics.map((item) => item.name)).size, 10, `${style} names unique`);
  }
  assert.equal(resolveStarterStyleKey(['tailored']), 'Smart & Professional');
  assert.equal(resolveStarterStyleKey(['unknown-style']), 'Classic & Elegant');
});

test('completing a profile seeds 10 style-matched wardrobe basics once', async () => {
  const api = await startApi();
  try {
    const created = await register(api.base, 'basics-seed@example.com');
    const headers = authHeaders(created.cookie, created.body.csrfToken);

    const empty = await fetch(`${api.base}/api/wardrobe`, { headers: { cookie: created.cookie } });
    const emptyBody = await empty.json() as { items: unknown[] };
    assert.equal(empty.status, 200);
    assert.equal(emptyBody.items.length, 0);

    const saved = await fetch(`${api.base}/api/profile`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        displayName: 'Naledi',
        styles: ['Casual & Comfortable'],
        sizes: { tops: 'M', bottoms: '32', dress: 'SA 34', shoe: '6' },
        budgetTier: '300-600',
        onboardingStatus: 'completed',
      }),
    });
    assert.equal(saved.status, 200);

    const wardrobe = await fetch(`${api.base}/api/wardrobe`, { headers: { cookie: created.cookie } });
    const body = await wardrobe.json() as {
      items: {
        name: string;
        isCapsule: boolean;
        notes: string | null;
        sizeLabel: string | null;
        category: string;
      }[];
    };
    assert.equal(wardrobe.status, 200);
    assert.equal(body.items.length, 10);
    assert.equal(body.items.every((item) => item.isCapsule), true);
    assert.equal(body.items.every((item) => String(item.notes ?? '').includes('Casual & Comfortable')), true);
    assert.ok(body.items.some((item) => item.category === 'tops' && item.sizeLabel === 'M'));
    assert.ok(body.items.some((item) => item.category === 'shoes' && item.sizeLabel === '6'));

    const again = await fetch(`${api.base}/api/profile`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ displayName: 'Naledi', styles: ['Casual & Comfortable'] }),
    });
    assert.equal(again.status, 200);
    const still = await fetch(`${api.base}/api/wardrobe`, { headers: { cookie: created.cookie } });
    const stillBody = await still.json() as { items: unknown[] };
    assert.equal(stillBody.items.length, 10);
  } finally {
    await api.close();
  }
});
