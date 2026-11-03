import assert from 'node:assert/strict';
import test from 'node:test';
import { buildLocalTryOnOpinion } from '../src/ai/tryOnOpinion.js';
import { authHeaders, register, startApi } from './harness.js';

test('local try-on opinion can say a look does not suit a pear silhouette', () => {
  const opinion = buildLocalTryOnOpinion(
    {
      stylistName: 'Nova',
      stylistGender: 'woman',
      stylistAgeVibe: 'thirties',
      stylistVoice: 'direct-practical',
      styles: ['Classic & Elegant'],
      bodyShape: 'pear',
      bodyShapeLabel: 'Pear',
      avoidColours: [],
    },
    [{ name: 'Skinny bodycon midi dress', category: 'one-pieces' }],
    false,
  );
  assert.equal(opinion.stylistName, 'Nova');
  assert.equal(opinion.verdict, 'miss');
  assert.match(opinion.headline.toLowerCase(), /does not suit|not this|skip/i);
});

test('local try-on opinion can praise a flattering hip-friendly cut', () => {
  const opinion = buildLocalTryOnOpinion(
    {
      stylistName: 'Aria',
      stylistGender: 'woman',
      stylistAgeVibe: 'thirties',
      stylistVoice: 'warm-encouraging',
      styles: ['Classic & Elegant'],
      bodyShape: 'pear',
      bodyShapeLabel: 'Pear',
      avoidColours: [],
    },
    [{ name: 'A-line wrap midi dress', category: 'one-pieces' }],
    false,
  );
  assert.equal(opinion.verdict, 'flatters');
  assert.match(opinion.body.toLowerCase(), /hip|balance|pear/);
});

test('try-on opinion endpoint returns persona-aware commentary', async () => {
  const api = await startApi();
  try {
    const created = await register(api.base, 'tryon-opinion@example.com');
    const headers = authHeaders(created.cookie, created.body.csrfToken);
    await fetch(`${api.base}/api/profile`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        displayName: 'Nikkie',
        styles: ['Classic & Elegant'],
        sizes: { tops: 'M', bottoms: 'M', dress: 'M', shoe: '6' },
        budgetTier: '600-1000',
        stylistName: 'Jules',
        stylistGender: 'non-binary',
        stylistAgeVibe: 'forties',
        stylistVoice: 'direct-practical',
        bodyShape: 'pear',
        onboardingStatus: 'completed',
      }),
    });
    await fetch(`${api.base}/api/preferences`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ aiPersonalisationConsent: true }),
    });
    const response = await fetch(`${api.base}/api/stylist/try-on-opinion`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        pieces: [{ name: 'Skinny bodycon dress', category: 'one-pieces' }],
        view: 'front',
        demonstration: true,
      }),
    });
    const body = await response.json() as {
      stylistName: string;
      verdict: string;
      headline: string;
      body: string;
      source: string;
      tips: string[];
    };
    assert.equal(response.status, 200);
    assert.equal(body.stylistName, 'Jules');
    assert.equal(body.source, 'local');
    assert.ok(body.headline);
    assert.ok(body.body);
    assert.ok(Array.isArray(body.tips));
  } finally {
    await api.close();
  }
});
