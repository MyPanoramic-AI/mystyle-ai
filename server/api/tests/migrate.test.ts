import assert from 'node:assert/strict';
import test from 'node:test';
import { loadConfig } from '../src/config.js';
import { migrate, openDatabase } from '../src/db.js';
import { startApi } from './harness.js';
import { createApp } from '../src/http/app.js';
import { RateLimiter } from '../src/auth/rateLimit.js';

test('migrations create the account tables and do not reapply', () => {
  const db = openDatabase(':memory:');
  const dir = loadConfig().migrationsDir;
  const first = migrate(db, dir);
  const second = migrate(db, dir);
  assert.deepEqual(first, ['001_initial.sql', '002_profile_details.sql', '003_ai_conversations.sql', '004_ai_usage_duration.sql', '005_wardrobe_planner.sql', '006_family_plans.sql']);
  assert.deepEqual(second, []);
  const names = (db.prepare(`SELECT name FROM sqlite_master WHERE type = 'table'`).all() as { name: string }[]).map((row) => row.name);
  for (const table of ['users', 'sessions', 'customer_profiles', 'user_preferences', 'media_assets', 'family_relationships', 'family_events', 'family_event_participants', 'wardrobe_items', 'saved_looks', 'saved_products', 'outfit_plans', 'subscription_entitlements', 'credit_ledger', 'audit_events', 'ai_conversations', 'ai_messages', 'ai_usage', 'schema_migrations']) {
    assert.equal(names.includes(table), true, table);
  }
});

test('the API refuses a public bind address', () => {
  assert.throws(() => loadConfig({ API_HOST: '0.0.0.0' }), /127\.0\.0\.1/);
});

test('a database failure returns 503 without a stack trace', async () => {
  const config = loadConfig();
  const app = createApp({
    db: { exec() {}, prepare() { throw new Error('disk path C:\\secret\\mystyle.sqlite'); } },
    config,
    now: () => Date.now(),
    rateLimiter: new RateLimiter(5, 1000, () => Date.now()),
  });
  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>((resolve) => server.once('listening', () => resolve()));
  try {
    const response = await fetch(`http://127.0.0.1:${(server.address() as { port: number }).port}/api/health`);
    const text = await response.text();
    assert.equal(response.status, 503);
    assert.equal(text.includes('secret'), false);
    assert.equal(text.includes('sqlite'), false);
  } finally {
    await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  }
});

test('health reports the local bind without a filesystem path', async () => {
  const api = await startApi();
  try {
    const response = await fetch(`${api.base}/api/health`);
    const body = await response.json() as { ok: boolean; bind: string; database: string };
    assert.equal(response.status, 200);
    assert.equal(body.ok, true);
    assert.equal(body.bind, '127.0.0.1');
    assert.equal(body.database, 'up');
  } finally {
    await api.close();
  }
});
