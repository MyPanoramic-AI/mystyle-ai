import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { openCatalogue } from '../src/catalogue.js';
import { matchProduct } from '../src/match/engine.js';

test('GTIN matches are exact and title resemblance is not', () => {
  const store = openCatalogue(':memory:', () => Date.parse('2026-10-16T12:00:00.000Z'), 86_400_000);
  const dataDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../data');
  store.importRecords('demo-atelier', 'json', JSON.parse(readFileSync(path.join(dataDir, 'mock-catalogue.json'), 'utf8')), 'upsert');
  store.importRecords('demo-outlet', 'json', JSON.parse(readFileSync(path.join(dataDir, 'mock-outlet.json'), 'utf8')), 'upsert');
  const products = store.listActive();
  const dress = products.find((product) => product.externalId === 'dress-black-36');
  assert.ok(dress);
  const matches = matchProduct(dress, products);
  const exact = matches.find((match) => match.kind === 'exact');
  const similar = matches.find((match) => match.kind === 'similar');
  const colour = matches.find((match) => match.kind === 'alternative_colour');
  assert.equal(exact?.confidence, 'identifier');
  assert.equal(exact?.priceDifferenceCents, -10000);
  assert.equal(similar?.confidence, 'textual');
  assert.match(similar?.reasons[0] ?? '', /not an identity match/);
  assert.equal(colour?.kind, 'alternative_colour');
  assert.equal(matches.some((match) => match.kind === 'exact' && match.confidence === 'textual'), false);
});
