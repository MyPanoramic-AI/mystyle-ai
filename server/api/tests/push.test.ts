import assert from 'node:assert/strict';
import test from 'node:test';
import { authHeaders, register, startApi } from './harness.js';
import type { PushConfig } from '../src/push/pushConfig.js';

const enabledPush: PushConfig = {
  enabled: true,
  publicKey: 'BD89qG_7QaFp5EBLV_A6j6EGrvSmHjoSdMn6C7-_ym0O9wesJBMj3Qk1RBnCf50gKffSgfXqBT3nufuAsYIsmn4',
  privateKey: 'CXyvh5D0dUva1ql_04qevpXkmqFdlJEwpNEraxY4w8E',
  subject: 'mailto:test@example.com',
  cronSecret: 'cron-secret-for-tests-0123456789',
};

const disabledPush: PushConfig = {
  enabled: false,
  publicKey: null,
  privateKey: null,
  subject: 'mailto:test@example.com',
  cronSecret: null,
};

test('push status reports disabled without VAPID keys', async () => {
  const api = await startApi({}, { pushConfig: disabledPush });
  try {
    const created = await register(api.base, 'push-off@example.com');
    const response = await fetch(`${api.base}/api/push/status`, {
      headers: { cookie: created.cookie },
    });
    assert.equal(response.status, 200);
    const body = await response.json() as { enabled: boolean; subscribed: boolean };
    assert.equal(body.enabled, false);
    assert.equal(body.subscribed, false);
  } finally {
    await api.close();
  }
});

test('push subscribe stores endpoint and test attempts delivery', async () => {
  const api = await startApi({}, { pushConfig: enabledPush });
  try {
    const created = await register(api.base, 'push-on@example.com');
    const headers = authHeaders(created.cookie, created.body.csrfToken);

    const keyResponse = await fetch(`${api.base}/api/push/vapid-public-key`, {
      headers: { cookie: created.cookie },
    });
    assert.equal(keyResponse.status, 200);
    const keyBody = await keyResponse.json() as { publicKey: string };
    assert.ok(keyBody.publicKey.startsWith('BD'));

    const subscribe = await fetch(`${api.base}/api/push/subscribe`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        endpoint: 'https://example.com/push/test-endpoint',
        keys: {
          p256dh: 'BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QTsHJQIWE6iwVS7DsdAzq5aYk8Z_eOQ8XzqGqzqzqzqzqzq',
          auth: 'tBHItJI5svbpez7KI4CCXg',
        },
      }),
    });
    assert.equal(subscribe.status, 201);

    const status = await fetch(`${api.base}/api/push/status`, {
      headers: { cookie: created.cookie },
    });
    const statusBody = await status.json() as { enabled: boolean; subscribed: boolean; subscriptionCount: number };
    assert.equal(statusBody.enabled, true);
    assert.equal(statusBody.subscribed, true);
    assert.equal(statusBody.subscriptionCount, 1);

    const testPush = await fetch(`${api.base}/api/push/test`, {
      method: 'POST',
      headers,
      body: '{}',
    });
    assert.equal(testPush.status, 200);
    const testBody = await testPush.json() as { attempted: number; delivered: number };
    assert.equal(testBody.attempted, 1);
    assert.equal(testBody.delivered, 0);
  } finally {
    await api.close();
  }
});
