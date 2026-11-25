import assert from 'node:assert/strict';
import test from 'node:test';
import { buildLookVisualPrompt, isAdditiveLookEdit, wantsLookVisualization } from '../src/ai/lookImage.js';

test('wantsLookVisualization detects hair and accessory requests', () => {
  assert.equal(wantsLookVisualization('Can you style my hair and add accessories?', false), true);
  assert.equal(wantsLookVisualization('Show me how this would look', false), true);
  assert.equal(wantsLookVisualization('What colours suit me?', false), false);
  assert.equal(wantsLookVisualization('Just advice please', true), true);
});

test('isAdditiveLookEdit detects shoe and accessory additions', () => {
  assert.equal(isAdditiveLookEdit('Add a nude pump shoe to the outfit'), true);
  assert.equal(isAdditiveLookEdit('Can you pair it with gold hoops?'), true);
  assert.equal(isAdditiveLookEdit('Show me a romantic picnic look in a floral midi'), false);
});

test('buildLookVisualPrompt keeps identity when a reference photo is present', () => {
  const withPhoto = buildLookVisualPrompt({
    userText: 'Add gold hoops and soft waves',
    modelPrompt: 'Soft waves, gold hoop earrings, polished finish',
    hasReferencePhoto: true,
  });
  assert.match(withPhoto, /Keep the same person/i);
  assert.match(withPhoto, /Soft waves, gold hoop earrings/);
  assert.match(withPhoto, /full-body/i);
  assert.match(withPhoto, /Never redesign the whole outfit into a single/i);

  const withoutPhoto = buildLookVisualPrompt({
    userText: 'Evening look with a sleek bun',
    modelPrompt: null,
    hasReferencePhoto: false,
  });
  assert.match(withoutPhoto, /photorealistic fashion look/i);
  assert.doesNotMatch(withoutPhoto, /Keep the same person/i);
  assert.match(withoutPhoto, /full-body/i);
});

test('buildLookVisualPrompt treats prior looks as additive edits', () => {
  const prior = buildLookVisualPrompt({
    userText: 'Add nude pumps to this look',
    modelPrompt: 'Keep the deep plum gown and place nude pumps on her feet',
    hasReferencePhoto: true,
    hasPriorLook: true,
  });
  assert.match(prior, /previous fashion look/i);
  assert.match(prior, /Preserve the same person/i);
  assert.match(prior, /ONLY the requested addition/i);
  assert.match(prior, /additive edit/i);
  assert.match(prior, /shoes on the feet/i);
  assert.match(prior, /never a product close-up/i);
});
