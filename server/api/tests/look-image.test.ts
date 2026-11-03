import assert from 'node:assert/strict';
import test from 'node:test';
import { buildLookVisualPrompt, wantsLookVisualization } from '../src/ai/lookImage.js';

test('wantsLookVisualization detects hair and accessory requests', () => {
  assert.equal(wantsLookVisualization('Can you style my hair and add accessories?', false), true);
  assert.equal(wantsLookVisualization('Show me how this would look', false), true);
  assert.equal(wantsLookVisualization('What colours suit me?', false), false);
  assert.equal(wantsLookVisualization('Just advice please', true), true);
});

test('buildLookVisualPrompt keeps identity when a reference photo is present', () => {
  const withPhoto = buildLookVisualPrompt({
    userText: 'Add gold hoops and soft waves',
    modelPrompt: 'Soft waves, gold hoop earrings, polished finish',
    hasReferencePhoto: true,
  });
  assert.match(withPhoto, /Keep the same person/i);
  assert.match(withPhoto, /Soft waves, gold hoop earrings/);

  const withoutPhoto = buildLookVisualPrompt({
    userText: 'Evening look with a sleek bun',
    modelPrompt: null,
    hasReferencePhoto: false,
  });
  assert.match(withoutPhoto, /photorealistic fashion look/i);
  assert.doesNotMatch(withoutPhoto, /Keep the same person/i);
});
