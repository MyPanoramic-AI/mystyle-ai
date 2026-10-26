import assert from 'node:assert/strict';
import test from 'node:test';
import { estimateFromMeasurements } from '../src/domain/silhouette.js';
import { authHeaders, register, startApi } from './harness.js';

test('measurement heuristic classifies common styling silhouettes', () => {
  assert.equal(estimateFromMeasurements(90, 68, 92).id, 'hourglass');
  assert.equal(estimateFromMeasurements(86, 72, 102).id, 'pear');
  assert.equal(estimateFromMeasurements(100, 78, 88).id, 'inverted-triangle');
  assert.equal(estimateFromMeasurements(94, 94, 94).id, 'apple');
  assert.equal(estimateFromMeasurements(88, 78, 90).id, 'rectangle');
});

test('silhouette estimate requires measurements and never claims photo AI', async () => {
  const api = await startApi();
  try {
    const created = await register(api.base, 'silhouette@example.com');
    const headers = authHeaders(created.cookie, created.body.csrfToken);

    const blocked = await fetch(`${api.base}/api/profile/silhouette/estimate`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ save: true }),
    });
    const blockedBody = await blocked.json() as { code: string };
    assert.equal(blocked.status, 400);
    assert.equal(blockedBody.code, 'measurements_required');

    const saved = await fetch(`${api.base}/api/profile`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        displayName: 'Sil',
        styles: ['tailored'],
        sizes: { tops: 'M' },
        budgetTier: '600-1000',
        measurements: { heightCm: 168, bustCm: 90, waistCm: 68, hipCm: 96 },
      }),
    });
    assert.equal(saved.status, 200);

    const estimated = await fetch(`${api.base}/api/profile/silhouette/estimate`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ save: true }),
    });
    const body = await estimated.json() as {
      estimate: {
        id: string;
        label: string;
        usedPhotoAi: boolean;
        source: string;
        photosReady: boolean;
        disclaimer: string;
      };
      profile: { bodyShape: string; bodyShapeSource: string; bodyShapeLabel: string };
    };
    assert.equal(estimated.status, 200);
    assert.equal(body.estimate.id, 'pear');
    assert.equal(body.estimate.label, 'Pear');
    assert.equal(body.estimate.usedPhotoAi, false);
    assert.equal(body.estimate.source, 'measurements');
    assert.equal(body.estimate.photosReady, false);
    assert.match(body.estimate.disclaimer, /not a medical/i);
    assert.equal(body.profile.bodyShape, 'pear');
    assert.equal(body.profile.bodyShapeSource, 'measurements');
    assert.equal(body.profile.bodyShapeLabel, 'Pear');

    const options = await fetch(`${api.base}/api/profile/silhouette/options`, { headers: { cookie: created.cookie } });
    const optionBody = await options.json() as { options: { id: string }[] };
    assert.equal(options.status, 200);
    assert.deepEqual(
      optionBody.options.map((item) => item.id),
      ['hourglass', 'pear', 'inverted-triangle', 'apple', 'rectangle'],
    );

    const manual = await fetch(`${api.base}/api/profile`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ bodyShape: 'hourglass', bodyShapeSource: 'manual' }),
    });
    const manualBody = await manual.json() as { bodyShape: string; bodyShapeSource: string };
    assert.equal(manual.status, 200);
    assert.equal(manualBody.bodyShape, 'hourglass');
    assert.equal(manualBody.bodyShapeSource, 'manual');

    const fromPhoto = await fetch(`${api.base}/api/profile/silhouette/estimate`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ save: true, photoScan: { id: 'inverted-triangle', confidence: 'high' } }),
    });
    const photoBody = await fromPhoto.json() as {
      estimate: { id: string; source: string; usedPhotoAi: boolean };
      profile: { bodyShape: string; bodyShapeSource: string };
    };
    assert.equal(fromPhoto.status, 200);
    assert.equal(photoBody.estimate.id, 'inverted-triangle');
    assert.equal(photoBody.estimate.source, 'photo_scan');
    assert.equal(photoBody.estimate.usedPhotoAi, false);
    assert.equal(photoBody.profile.bodyShape, 'inverted-triangle');
    assert.equal(photoBody.profile.bodyShapeSource, 'photo_scan');
  } finally {
    await api.close();
  }
});
