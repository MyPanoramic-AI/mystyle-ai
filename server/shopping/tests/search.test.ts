import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { openCatalogue } from '../src/catalogue.js';
import { parseSearch } from '../src/search/parse.js';

const dataDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../data');

function catalogue() {
  const store = openCatalogue(':memory:', () => Date.parse('2026-10-16T12:00:00.000Z'), 24 * 60 * 60 * 1000);
  const atelier = JSON.parse(readFileSync(path.join(dataDir, 'mock-catalogue.json'), 'utf8')) as unknown[];
  const outlet = JSON.parse(readFileSync(path.join(dataDir, 'mock-outlet.json'), 'utf8')) as unknown[];
  store.importRecords('demo-atelier', 'json', atelier, 'upsert');
  store.importRecords('demo-outlet', 'json', outlet, 'upsert');
  return store;
}

test('natural-language examples filter the demo catalogue', () => {
  const store = catalogue();
  const dresses = store.search(parseSearch('Black evening dresses under R1,500.'));
  assert.ok(dresses.products.some((product) => product.title === 'Black evening dress'));
  assert.equal(dresses.products.some((product) => product.currencyNote), false);
  assert.ok(dresses.products.every((product) => product.price.status !== 'present' || product.price.value.cents <= 150000));

  const sneakers = store.search(parseSearch("Women's white sneakers size 6."));
  assert.deepEqual(sneakers.products.map((product) => product.title), ['White court sneakers']);

  const shirts = store.search(parseSearch("Men's navy formal shirts under R800."));
  assert.deepEqual(shirts.products.map((product) => product.title), ['Navy formal shirt']);

  const guest = store.search(parseSearch('Wedding guest outfits under R2,000.'));
  assert.deepEqual(guest.products.map((product) => product.title), ['Wedding guest outfit']);

  const jackets = store.search(parseSearch('Winter jackets in Cape Town.'));
  assert.equal(jackets.products[0]?.title, 'Winter jacket');
  assert.match(jackets.notes[0] ?? '', /Cape Town/);
  assert.equal(jackets.products[0]?.availability.status, 'unavailable');
});

test('price sort, pagination, stale prices, and rand boundaries', () => {
  const store = catalogue();
  const sorted = store.search(parseSearch('', { sort: 'price_asc', pageSize: 2, page: 1 }));
  assert.equal(sorted.products.length, 2);
  assert.equal(sorted.products[0]?.title, 'Stale demo tee');
  assert.equal(sorted.products[0]?.freshness, 'stale');
  assert.equal(sorted.products[0]?.price.status, 'present');
  if (sorted.products[0]?.price.status === 'present') {
    assert.equal(sorted.products[0].price.value.warning, 'Potentially stale.');
  }
  const imported = store.search(parseSearch('Imported sample coat'));
  assert.equal(imported.products[0]?.currencyNote !== null, true);
  const capped = store.search(parseSearch('coat under R1,500'));
  assert.equal(capped.products.some((product) => product.title === 'Imported sample coat'), false);
});

test('a quoted search cannot change the SQL result set', () => {
  const store = catalogue();
  const hostile = store.search(parseSearch("' OR 1=1 --"));
  assert.equal(hostile.total, 0);
});
