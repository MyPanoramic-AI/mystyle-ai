import assert from 'node:assert/strict';
import test from 'node:test';
import { authHeaders, register, startApi } from './harness.js';
import {
  dailyNotificationLimit,
  hearMoreFromMeEnabled,
} from '../src/domain/notificationFrequency.js';

test('hear more defaults off and raises the daily tip limit', () => {
  assert.equal(hearMoreFromMeEnabled(undefined), false);
  assert.equal(hearMoreFromMeEnabled({ hearMoreFromMe: false }), false);
  assert.equal(hearMoreFromMeEnabled({ hearMoreFromMe: true }), true);
  assert.equal(dailyNotificationLimit({ hearMoreFromMe: false }), 1);
  assert.equal(dailyNotificationLimit({ hearMoreFromMe: true }), 5);
});

test('account preferences persist hearMoreFromMe', async () => {
  const api = await startApi();
  try {
    const created = await register(api.base, 'hear-more@example.com');
    const headers = authHeaders(created.cookie, created.body.csrfToken);
    const initial = await fetch(`${api.base}/api/preferences`, { headers: { cookie: created.cookie } });
    const initialBody = await initial.json() as { notifications: { hearMoreFromMe?: boolean } };
    assert.equal(initial.status, 200);
    assert.equal(initialBody.notifications.hearMoreFromMe, false);

    const saved = await fetch(`${api.base}/api/preferences`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        privacy: { shareProfileWithStylist: false },
        notifications: { productAlerts: false, hearMoreFromMe: true },
      }),
    });
    const savedBody = await saved.json() as { notifications: { hearMoreFromMe: boolean } };
    assert.equal(saved.status, 200);
    assert.equal(savedBody.notifications.hearMoreFromMe, true);
  } finally {
    await api.close();
  }
});
