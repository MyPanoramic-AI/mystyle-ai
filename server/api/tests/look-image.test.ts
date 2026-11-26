import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildLookVisualPrompt,
  composeLookReferences,
  isAdditiveLookEdit,
  normalizeLookBrief,
  shouldAttachLookImage,
  wantsLookVisualization,
} from '../src/ai/lookImage.js';

test('wantsLookVisualization detects hair and accessory requests', () => {
  assert.equal(wantsLookVisualization('Can you style my hair and add accessories?', false), true);
  assert.equal(wantsLookVisualization('Show me how this would look', false), true);
  assert.equal(wantsLookVisualization('What colours suit me?', false), false);
  assert.equal(wantsLookVisualization('Just advice please', true), true);
  assert.equal(wantsLookVisualization('add red slippers please', false), false);
});

test('isAdditiveLookEdit detects shoe and accessory additions', () => {
  assert.equal(isAdditiveLookEdit('Add a nude pump shoe to the outfit'), true);
  assert.equal(isAdditiveLookEdit('add red slippers please'), true);
  assert.equal(isAdditiveLookEdit('Can you pair it with gold hoops?'), true);
  assert.equal(isAdditiveLookEdit('Finish with nude pumps'), true);
  assert.equal(isAdditiveLookEdit('Show me a romantic picnic look in a floral midi'), false);
  assert.equal(isAdditiveLookEdit('add three more outfit ideas'), false);
});

test('shouldAttachLookImage regenerates when finishing a prior look', () => {
  assert.equal(shouldAttachLookImage({
    userText: 'add red slippers please',
    modelIntent: false,
    hasPriorLook: true,
  }), true);
  assert.equal(shouldAttachLookImage({
    userText: 'add red slippers please',
    modelIntent: false,
    hasPriorLook: false,
  }), false);
  assert.equal(shouldAttachLookImage({
    userText: 'What colours suit me?',
    modelIntent: false,
    hasPriorLook: true,
  }), false);
});

test('normalizeLookBrief forces full-body framing for additive shoe edits', () => {
  const brief = normalizeLookBrief({
    userText: 'Add a nude pump shoe to the outfit',
    modelPrompt: 'nude pumps',
    outfitContext: 'Deep Plum Wine Draped Asymmetric Column Gown',
    additive: true,
  });
  assert.match(brief, /SAME full-body/i);
  assert.match(brief, /nude pumps/i);
  assert.match(brief, /Deep Plum Wine/i);
  assert.match(brief, /shoes clearly on their feet/i);
  assert.doesNotMatch(brief, /^nude pumps$/i);
});

test('buildLookVisualPrompt keeps identity when a reference photo is present', () => {
  const withPhoto = buildLookVisualPrompt({
    userText: 'Add gold hoops and soft waves',
    modelPrompt: 'Soft waves, gold hoop earrings, polished finish',
    hasReferencePhoto: true,
    hasCustomerPhoto: true,
  });
  assert.match(withPhoto, /IDENTITY LOCK/i);
  assert.match(withPhoto, /Soft waves, gold hoop earrings/);
  assert.match(withPhoto, /full-body/i);
  assert.match(withPhoto, /FORBIDDEN: product photography/i);

  const withoutPhoto = buildLookVisualPrompt({
    userText: 'Evening look with a sleek bun',
    modelPrompt: null,
    hasReferencePhoto: false,
  });
  assert.match(withoutPhoto, /photorealistic fashion look/i);
  assert.doesNotMatch(withoutPhoto, /IDENTITY LOCK/i);
  assert.match(withoutPhoto, /full-body/i);
});

test('buildLookVisualPrompt treats prior looks as additive edits with customer identity', () => {
  const prior = buildLookVisualPrompt({
    userText: 'Add nude pumps to this look',
    modelPrompt: 'Keep the deep plum gown and place nude pumps on her feet',
    hasReferencePhoto: true,
    hasPriorLook: true,
    hasCustomerPhoto: true,
    outfitContext: 'Deep plum draped asymmetric column gown',
  });
  assert.match(prior, /customer photograph/i);
  assert.match(prior, /IDENTITY LOCK/i);
  assert.match(prior, /ONLY the requested addition/i);
  assert.match(prior, /additive edit/i);
  assert.match(prior, /shoes on both feet|shoes clearly on their feet/i);
  assert.match(prior, /never the added accessory alone/i);
  assert.match(prior, /Deep plum draped/i);
});

test('composeLookReferences always puts customer photos before prior looks', () => {
  const profile = [{ mimeType: 'image/jpeg', base64: 'profile-face-bytes' }];
  const prior = { mimeType: 'image/png', base64: 'prior-look-bytes' };
  const composed = composeLookReferences({
    profileImages: profile,
    priorLookImage: prior,
  });
  assert.equal(composed.hasCustomerPhoto, true);
  assert.equal(composed.hasPriorLook, true);
  assert.equal(composed.references[0]?.base64, 'profile-face-bytes');
  assert.equal(composed.references[1]?.base64, 'prior-look-bytes');
});
