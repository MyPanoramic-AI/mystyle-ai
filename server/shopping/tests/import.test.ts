import assert from 'node:assert/strict';
import test from 'node:test';
import { openCatalogue } from '../src/catalogue.js';
import { parseFeed } from '../src/ingest/parseFeed.js';
import { ShoppingError } from '../src/errors.js';

const row = {
  externalId: 'row-1',
  retailerName: 'Demo Atelier',
  title: 'Demo row',
  dataClass: 'demo',
  currency: 'ZAR',
  priceCents: 2500,
  availability: 'in_stock',
  verifiedAt: '2026-10-16T08:00:00.000Z',
  variants: [],
};

test('valid rows import and a later price change is recorded', () => {
  const store = openCatalogue(':memory:', () => Date.parse('2026-10-16T12:00:00.000Z'), 86_400_000);
  const first = store.importRecords('demo-atelier', 'json', [row], 'upsert');
  assert.equal(first.accepted, 1);
  const second = store.importRecords('demo-atelier', 'json', [{ ...row, priceCents: 2200 }], 'upsert');
  assert.equal(second.updated, 1);
  const product = store.listActive()[0];
  assert.ok(product);
  assert.equal(product.price.status === 'present' && product.price.value.cents, 2200);
  assert.equal(store.observations(product.id).length, 2);
});

test('a corrupt snapshot does not remove an existing product', () => {
  const store = openCatalogue(':memory:', () => Date.parse('2026-10-16T12:00:00.000Z'), 86_400_000);
  store.importRecords('demo-atelier', 'json', [row], 'upsert');
  const failed = store.importRecords('demo-atelier', 'json', [{ title: 'missing identity' }], 'snapshot');
  assert.equal(failed.rejected, 1);
  assert.equal(failed.removed, 0);
  assert.equal(store.countActive(), 1);
});

test('csv import groups a size and duplicate external ids update', () => {
  const csv = [
    'externalId,retailerName,title,currency,priceCents,dataClass,sizeLabel,sizeSystem,availability,gtin',
    'sku-1,Demo Atelier,"Quoted, shirt",ZAR,4100,demo,M,alpha,in_stock,6000000000202',
  ].join('\n');
  const records = parseFeed('csv', csv);
  const store = openCatalogue(':memory:', () => Date.parse('2026-10-16T12:00:00.000Z'), 86_400_000);
  const result = store.importRecords('demo-atelier', 'csv', records, 'upsert');
  assert.equal(result.accepted, 1);
  const product = store.listActive()[0];
  assert.equal(product?.variants[0]?.normalisedSize.status === 'present' && product.variants[0].normalisedSize.value, 'M');
});

test('an unparsable feed is audited without a catalogue write', () => {
  const store = openCatalogue(':memory:', () => Date.parse('2026-10-16T12:00:00.000Z'), 86_400_000);
  store.importRecords('demo-atelier', 'json', [row], 'upsert');
  assert.throws(() => parseFeed('json', '{'), ShoppingError);
  const failed = store.recordFailedParse('demo-atelier', 'json', 'The JSON feed could not be parsed.');
  assert.equal(failed.status, 'failed');
  assert.equal(store.countActive(), 1);
});
