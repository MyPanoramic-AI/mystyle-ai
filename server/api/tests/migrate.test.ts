import assert from 'node:assert/strict';
import { tmpdir } from 'node:os';
import path from 'node:path';
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
  assert.deepEqual(first, ['001_initial.sql', '002_profile_details.sql', '003_ai_conversations.sql', '004_ai_usage_duration.sql', '005_wardrobe_planner.sql', '006_family_plans.sql', '007_beauty_studio.sql', '008_membership_accounting.sql', '009_privacy_controls.sql', '010_email_account_security.sql', '011_profile_photo_slots.sql', '012_tryon_jobs.sql']);
  assert.deepEqual(second, []);
  const names = (db.prepare(`SELECT name FROM sqlite_master WHERE type = 'table'`).all() as { name: string }[]).map((row) => row.name);
  for (const table of ['users', 'sessions', 'customer_profiles', 'user_preferences', 'media_assets', 'family_relationships', 'family_events', 'family_event_participants', 'wardrobe_items', 'saved_looks', 'saved_products', 'outfit_plans', 'beauty_preferences', 'beauty_looks', 'beauty_outfit_links', 'subscription_entitlements', 'credit_ledger', 'audit_events', 'ai_conversations', 'ai_messages', 'ai_usage', 'schema_migrations', 'plan_definitions', 'credit_reservations', 'credit_idempotency', 'provider_costs', 'allocation_periods', 'billing_policies', 'privacy_notice_versions', 'consent_records', 'data_export_jobs', 'account_deletion_requests', 'retention_policies', 'email_verification_tokens', 'password_reset_tokens', 'transactional_email_capture', 'tryon_jobs']) {
    assert.equal(names.includes(table), true, table);
  }
});

test('the API refuses a public bind address outside hosted profiles', () => {
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
    const response = await fetch(`http://127.0.0.1:${(server.address() as { port: number }).port}/api/ready`);
    const text = await response.text();
    assert.equal(response.status, 503);
    assert.equal(text.includes('secret'), false);
    assert.equal(text.includes('sqlite'), false);
  } finally {
    await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  }
});

test('health is live without database proof and ready reports database status', async () => {
  const api = await startApi();
  try {
    const live = await fetch(`${api.base}/api/health`);
    const liveBody = await live.json() as { ok: boolean; status: string };
    assert.equal(live.status, 200);
    assert.equal(liveBody.ok, true);
    assert.equal(liveBody.status, 'live');
    assert.equal('bind' in liveBody, false);

    const ready = await fetch(`${api.base}/api/ready`);
    const readyBody = await ready.json() as { ok: boolean; status: string; database: string };
    assert.equal(ready.status, 200);
    assert.equal(readyBody.ok, true);
    assert.equal(readyBody.status, 'ready');
    assert.equal(readyBody.database, 'up');
  } finally {
    await api.close();
  }
});

test('a test data directory can isolate storage and Render may mount an absolute disk path', () => {
  const isolated = path.join(tmpdir(), 'mystyle-qa-config');
  const local = loadConfig({ API_DATA_DIR: isolated, API_PORT: '4341' });
  assert.equal(local.databasePath, path.join(isolated, 'mystyle.sqlite'));
  assert.equal(local.databasePath.includes(`${path.sep}private${path.sep}`), false);

  const mounted = path.join(tmpdir(), 'mystyle-render-disk');
  const hosted = loadConfig({
    RENDER: 'true',
    API_HOST: '0.0.0.0',
    API_DATA_DIR: mounted,
    RENDER_EXTERNAL_URL: 'https://example.onrender.com',
    API_ALLOWED_ORIGINS: 'https://example.onrender.com',
    API_ADMIN_TOKEN: 'test-admin-token-20chars',
  });
  assert.equal(hosted.databasePath, path.join(mounted, 'mystyle.sqlite'));
  assert.equal(hosted.secureCookie, true);
  assert.equal(hosted.trustProxy, true);
  assert.equal(hosted.appEnv, 'production');
});
