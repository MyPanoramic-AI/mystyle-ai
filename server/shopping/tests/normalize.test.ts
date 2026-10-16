import assert from 'node:assert/strict';
import test from 'node:test';
import { ShoppingError } from '../src/errors.js';
import { normaliseProduct } from '../src/normalize/product.js';

const base = {
  externalId: 'item-1',
  retailerName: 'Demo Atelier',
  title: 'Demo shirt',
  dataClass: 'demo',
  currency: 'ZAR',
  priceCents: 1000,
  variants: [],
};

test('missing price stays empty instead of becoming zero', () => {
  const stored = normaliseProduct({ ...base, priceCents: null, currency: null });
  assert.equal(stored.source.priceCents, null);
  assert.equal(stored.source.availability, null);
});

test('a missing availability value is not stored as in stock', () => {
  const stored = normaliseProduct({ ...base, availability: null });
  assert.equal(stored.source.availability, null);
});

test('invalid prices and availability are rejected', () => {
  assert.throws(() => normaliseProduct({ ...base, priceCents: 10.5 }), ShoppingError);
  assert.throws(() => normaliseProduct({ ...base, availability: 'available' }), ShoppingError);
  assert.throws(() => normaliseProduct({ ...base, priceCents: 1000, currency: null }), ShoppingError);
});
