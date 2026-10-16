import assert from 'node:assert/strict';
import test from 'node:test';
import { normaliseSize, sizeMatches } from '../src/normalize/size.js';

test('alpha and SA labels are preserved without a cross-system conversion', () => {
  const alpha = normaliseSize('M', 'alpha');
  assert.equal(alpha.confidence, 'reliable');
  assert.equal(alpha.normalisedLabel, 'M');
  assert.match(alpha.note, /not converted/i);
  const sa = normaliseSize('36', 'sa');
  assert.equal(sa.normalisedLabel, 'SA 36');
  assert.match(sa.note, /No UK conversion/);
  const shoe = normaliseSize('6', 'shoe_uk');
  assert.equal(shoe.confidence, 'uncertain');
});

test('size matching does not treat 6 as 16 or S as XS', () => {
  assert.equal(sizeMatches('16', '16', '6'), false);
  assert.equal(sizeMatches('XS', 'XS', 'S'), false);
  assert.equal(sizeMatches('36', 'SA 36', '36'), true);
  assert.equal(sizeMatches('M', 'M', 'M'), true);
});
