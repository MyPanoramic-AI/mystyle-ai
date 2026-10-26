import assert from 'node:assert/strict';
import test from 'node:test';
import { authHeaders, register, startApi } from './harness.js';

test('preset-style wardrobe payload with local asset imageUrl saves', async () => {
  const api = await startApi();
  try {
    const ada = await register(api.base, 'wardrobe-asset-url@example.com');
    const payload = {
      name: 'Fine Gauge Merino Turtleneck',
      category: 'tops',
      colour: 'Ivory Cream, Soft Blush, Camel Tan',
      colourHex: '#F3EFE6',
      brand: 'Woolworths Classic',
      subcategory: 'Knitwear',
      seasons: ['autumn', 'winter', 'spring'],
      occasions: ['work', 'casual'],
      fabric: '100% Merino Wool',
      careNote: 'Gentle wash, cool iron',
      pairingNotes: null,
      notes: null,
      imageUrl: '/assets/fashion_weekend_casual_1791978401075-Cabc1234.jpg',
      mediaId: null,
      isFavorite: false,
      isCapsule: true,
      timesWorn: 0,
      lastWornAt: null,
      sizeLabel: null,
    };
    const response = await fetch(`${api.base}/api/wardrobe`, {
      method: 'POST',
      headers: authHeaders(ada.cookie, ada.body.csrfToken),
      body: JSON.stringify(payload),
    });
    const text = await response.text();
    assert.equal(response.status, 201, text);
    const body = JSON.parse(text) as { name: string; imageUrl: string | null };
    assert.equal(body.name, payload.name);
    assert.equal(body.imageUrl, payload.imageUrl);
  } finally {
    await api.close();
  }
});

test('unsplash imageUrl still saves', async () => {
  const api = await startApi();
  try {
    const ada = await register(api.base, 'wardrobe-unsplash@example.com');
    const imageUrl = 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=700&q=80';
    const response = await fetch(`${api.base}/api/wardrobe`, {
      method: 'POST',
      headers: authHeaders(ada.cookie, ada.body.csrfToken),
      body: JSON.stringify({
        name: 'White shirt',
        category: 'tops',
        colour: 'Pure White',
        colourHex: '#FFFFFF',
        imageUrl,
        seasons: ['all-season'],
        occasions: ['work'],
      }),
    });
    const text = await response.text();
    assert.equal(response.status, 201, text);
  } finally {
    await api.close();
  }
});

test('blob and data imageUrl are rejected with a clear error', async () => {
  const api = await startApi();
  try {
    const ada = await register(api.base, 'wardrobe-blob@example.com');
    const response = await fetch(`${api.base}/api/wardrobe`, {
      method: 'POST',
      headers: authHeaders(ada.cookie, ada.body.csrfToken),
      body: JSON.stringify({
        name: 'Broken preview',
        category: 'tops',
        colour: 'Navy Midnight',
        imageUrl: 'blob:https://example.com/abc',
        seasons: ['all-season'],
        occasions: ['casual'],
      }),
    });
    const text = await response.text();
    assert.equal(response.status, 400, text);
    assert.match(text, /preset image or upload/i);
  } finally {
    await api.close();
  }
});
