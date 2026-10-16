import assert from 'node:assert/strict';
import test from 'node:test';
import type { AddressInfo } from 'node:net';
import { openCatalogue } from '../src/catalogue.js';
import { createConnectors } from '../src/connectors/registry.js';
import { createApp } from '../src/http/app.js';

async function start() {
  const catalogue = openCatalogue(':memory:', () => Date.parse('2026-10-16T12:00:00.000Z'), 86_400_000);
  const connectors = createConnectors();
  const app = createApp({ catalogue, connectors, token: 'shopping-test-token', host: '127.0.0.1' });
  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>((resolve) => server.once('listening', () => resolve()));
  const address = server.address() as AddressInfo;
  return {
    base: `http://127.0.0.1:${address.port}`,
    close: () => new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve()))),
  };
}

test('health is local and protected routes reject a missing or wrong token', async () => {
  const server = await start();
  try {
    const health = await fetch(`${server.base}/api/health`);
    const body = await health.json() as { verifiedLiveConnectors: number; bind: string };
    assert.equal(health.status, 200);
    assert.equal(body.bind, '127.0.0.1');
    assert.equal(body.verifiedLiveConnectors, 0);
    const missing = await fetch(`${server.base}/api/connectors`);
    assert.equal(missing.status, 401);
    const wrong = await fetch(`${server.base}/api/connectors`, { headers: { Authorization: 'Bearer wrong-token' } });
    assert.equal(wrong.status, 401);
    const page = await fetch(server.base);
    assert.equal(page.status, 200);
    assert.match(await page.text(), /DEMO/);
  } finally {
    await server.close();
  }
});

test('an authenticated import syncs the mock connector and refuses a remote URL', async () => {
  const server = await start();
  const headers = { Authorization: 'Bearer shopping-test-token', 'Content-Type': 'application/json' };
  try {
    const remote = await fetch(`${server.base}/api/imports`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ connectorId: 'demo-atelier', format: 'json', url: 'https://example.invalid/feed.json', content: '[]' }),
    });
    assert.equal(remote.status, 400);
    const blocked = await fetch(`${server.base}/api/imports`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ connectorId: 'woolworths', format: 'connector' }),
    });
    assert.equal(blocked.status, 409);
    const synced = await fetch(`${server.base}/api/imports`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ connectorId: 'demo-atelier', format: 'connector' }),
    });
    assert.equal(synced.status, 201);
    const results = await fetch(`${server.base}/api/products?q=${encodeURIComponent('Black evening dresses under R1,500')}`, { headers });
    const payload = await results.json() as { products: { demo: boolean; title: string }[] };
    assert.equal(results.status, 200);
    assert.equal(payload.products.some((product) => product.demo && product.title === 'Black evening dress'), true);
  } finally {
    await server.close();
  }
});
