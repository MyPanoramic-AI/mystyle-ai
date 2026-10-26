import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { loadConfig } from '../src/config.js';
import { migrate, openDatabase } from '../src/db.js';
import { createApp } from '../src/http/app.js';
import { RateLimiter } from '../src/auth/rateLimit.js';
import { sessionCookie } from '../src/auth/sessions.js';
import {
  assertBackupPruneDisabled,
  createSqliteBackup,
  mediaLedgerConsistency,
  restoreBackup,
  verifyBackup,
} from '../src/ops/backup.js';
import { assertProductionSafeConfig, resolveAppEnvironment } from '../src/ops/environment.js';
import { classifyDataPersistence } from '../src/ops/persistence.js';
import { register, startApi } from './harness.js';

const PROD_ADMIN = 'infrastructure-admin-token-ok';

function productionEnv(extra: Record<string, string> = {}): NodeJS.ProcessEnv {
  return {
    APP_ENV: 'production',
    API_HOST: '0.0.0.0',
    API_PUBLIC_ORIGIN: 'https://mystyle.example',
    API_ALLOWED_ORIGINS: 'https://mystyle.example',
    API_ADMIN_TOKEN: PROD_ADMIN,
    AI_ALLOW_LIVE: 'false',
    API_RETENTION_CLEANUP_ENABLED: 'false',
    ...extra,
  };
}

test('environment profiles resolve development, test, staging, and production', () => {
  assert.equal(resolveAppEnvironment({}), 'development');
  assert.equal(resolveAppEnvironment({ NODE_ENV: 'test' }), 'test');
  assert.equal(resolveAppEnvironment({ APP_ENV: 'staging' }), 'staging');
  assert.equal(resolveAppEnvironment({ APP_ENV: 'production' }), 'production');
  assert.equal(resolveAppEnvironment({ RENDER: 'true' }), 'production');
});

test('data persistence classifies Render disk vs ephemeral vs local', () => {
  assert.equal(classifyDataPersistence({ dataDir: '/var/data', apiDataDirEnv: '/var/data', onRender: true }), 'persistent');
  assert.equal(classifyDataPersistence({ dataDir: '/var/data/media', apiDataDirEnv: '/var/data', onRender: true }), 'persistent');
  assert.equal(classifyDataPersistence({ dataDir: '/opt/render/project/src/server/api/private', onRender: true }), 'ephemeral');
  assert.equal(classifyDataPersistence({ dataDir: 'C:\\Users\\x\\server\\api\\private', onRender: false }), 'local');
});

test('ready reports persistence mode', async () => {
  const api = await startApi();
  try {
    const response = await fetch(`${api.base}/api/ready`);
    assert.equal(response.status, 200);
    const body = await response.json() as { ok: boolean; persistence: string };
    assert.equal(body.ok, true);
    assert.equal(body.persistence, 'local');
  } finally {
    await api.close();
  }
});

test('invalid production configuration fails safely without printing secrets', () => {
  assert.throws(
    () => loadConfig({ APP_ENV: 'production', API_HOST: '0.0.0.0', API_ADMIN_TOKEN: PROD_ADMIN }),
    /https/,
  );
  assert.throws(
    () => loadConfig(productionEnv({ API_ADMIN_TOKEN: '' })),
    /API_ADMIN_TOKEN/,
  );
  assert.throws(
    () => loadConfig(productionEnv({
      API_ALLOWED_ORIGINS: 'http://127.0.0.1:3000,https://mystyle.example',
      API_PUBLIC_ORIGIN: 'https://mystyle.example',
    })),
    /non-localhost/,
  );
  assert.throws(
    () => loadConfig(productionEnv({ AI_ALLOW_LIVE: 'true' })),
    /AI_ALLOW_LIVE/,
  );
  assert.throws(
    () => loadConfig(productionEnv({ PAYMENTS_ENABLED: 'true' })),
    /Payments/,
  );
  assert.throws(
    () => loadConfig(productionEnv({ API_RETENTION_CLEANUP_ENABLED: 'true' })),
    /RETENTION_CLEANUP_ACK/,
  );
  try {
    loadConfig(productionEnv({ API_ADMIN_TOKEN: 'short' }));
    assert.fail('expected throw');
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    assert.equal(message.includes(PROD_ADMIN), false);
    assert.match(message, /20 characters|API_ADMIN_TOKEN/);
  }
});

test('production-safe config accepts complete staging and production profiles', () => {
  const production = loadConfig(productionEnv());
  assert.equal(production.appEnv, 'production');
  assert.equal(production.secureCookie, true);
  assert.equal(production.trustProxy, true);
  assert.ok(production.staticDir);

  const staging = loadConfig({
    ...productionEnv({ APP_ENV: 'staging', API_PUBLIC_ORIGIN: 'https://staging.example', API_ALLOWED_ORIGINS: 'https://staging.example' }),
  });
  assert.equal(staging.appEnv, 'staging');
  assert.equal(staging.secureCookie, true);
});

test('secure cookies are set under simulated HTTPS production config', async () => {
  const api = await startApi({ secureCookie: true, trustProxy: true });
  try {
    const { response } = await register(api.base, 'secure-cookie@example.com');
    const lined = typeof response.headers.getSetCookie === 'function' ? response.headers.getSetCookie() : [];
    const line = lined[0] ?? response.headers.get('set-cookie') ?? '';
    assert.match(line, /HttpOnly/i);
    assert.match(line, /SameSite=Lax/i);
    assert.match(line, /Secure/i);
    assert.equal(sessionCookie('abc', 60, true).includes('Secure'), true);
    assert.equal(sessionCookie('abc', 60, false).includes('Secure'), false);
  } finally {
    await api.close();
  }
});

test('unsafe browser origins are rejected for mutating requests', async () => {
  const api = await startApi();
  try {
    const response = await fetch(`${api.base}/api/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: 'https://evil.example' },
      body: JSON.stringify({ email: 'a@example.com', password: 'correct-horse-12' }),
    });
    assert.equal(response.status, 403);
    const body = await response.json() as { code: string };
    assert.equal(body.code, 'forbidden_origin');
  } finally {
    await api.close();
  }
});

test('private storage stays outside the public React dist directory', () => {
  const config = loadConfig({ API_HOST: '127.0.0.1' });
  assert.equal(config.mediaDir.includes(`${path.sep}dist${path.sep}`), false);
  assert.equal(config.databasePath.includes(`${path.sep}dist${path.sep}`), false);
  assert.equal(config.exportsDir.includes(`${path.sep}dist${path.sep}`), false);
  assert.ok(config.mediaDir.includes('media'));
});

test('failed database readiness does not leak filesystem paths', async () => {
  const config = loadConfig();
  const app = createApp({
    db: {
      exec() {},
      prepare() {
        throw new Error('open failed for /var/secret/customer-photos/mystyle.sqlite');
      },
    },
    config,
    now: () => Date.now(),
    rateLimiter: new RateLimiter(5, 1000, () => Date.now()),
  });
  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>((resolve) => server.once('listening', () => resolve()));
  try {
    const live = await fetch(`http://127.0.0.1:${(server.address() as { port: number }).port}/api/health`);
    assert.equal(live.status, 200);
    assert.equal(((await live.json()) as { status: string }).status, 'live');

    const ready = await fetch(`http://127.0.0.1:${(server.address() as { port: number }).port}/api/ready`);
    const text = await ready.text();
    assert.equal(ready.status, 503);
    assert.equal(text.includes('secret'), false);
    assert.equal(text.includes('customer-photos'), false);
    assert.equal(text.includes('sqlite'), false);
  } finally {
    await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  }
});

test('migrations upgrade from an early schema fixture and remain idempotent', () => {
  const root = mkdtempSync(path.join(tmpdir(), 'mystyle-migrate-fixture-'));
  const migrationsDir = loadConfig().migrationsDir;
  try {
    const dbPath = path.join(root, 'fixture.sqlite');
    const db = openDatabase(dbPath);
    const early = migrate(db, migrationsDir);
    assert.equal(early[0], '001_initial.sql');
    assert.ok(early.includes('010_email_account_security.sql'));
    const again = migrate(db, migrationsDir);
    assert.deepEqual(again, []);
    db.close();

    const prior = openDatabase(path.join(root, 'prior.sqlite'));
    // Simulate a database that stopped after wardrobe (005) before later domains.
    const files = ['001_initial.sql', '002_profile_details.sql', '003_ai_conversations.sql', '004_ai_usage_duration.sql', '005_wardrobe_planner.sql'];
    prior.exec(`CREATE TABLE IF NOT EXISTS schema_migrations (version TEXT PRIMARY KEY, applied_at TEXT NOT NULL)`);
    for (const file of files) {
      const sql = readFileSync(path.join(migrationsDir, file), 'utf8');
      prior.exec(sql);
      prior.prepare('INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)').run(file, new Date().toISOString());
    }
    const upgraded = migrate(prior, migrationsDir);
    assert.deepEqual(upgraded, ['006_family_plans.sql', '007_beauty_studio.sql', '008_membership_accounting.sql', '009_privacy_controls.sql', '010_email_account_security.sql', '011_profile_photo_slots.sql', '012_tryon_jobs.sql']);
    assert.deepEqual(migrate(prior, migrationsDir), []);
    prior.prepare('PRAGMA foreign_key_check').all();
    prior.close();
  } finally {
    try {
      rmSync(root, { recursive: true, force: true });
    } catch {
      // Windows may briefly lock WAL companions after close.
    }
  }
});

test('sqlite backup, verify, restore, and media ledger checks work on isolated fixtures', async () => {
  const root = mkdtempSync(path.join(tmpdir(), 'mystyle-backup-'));
  const dataDir = path.join(root, 'data');
  const backupRoot = path.join(root, 'backups');
  const restoreDir = path.join(root, 'restore');
  mkdirSync(path.join(dataDir, 'media'), { recursive: true });
  mkdirSync(backupRoot, { recursive: true });
  const dbPath = path.join(dataDir, 'mystyle.sqlite');
  const mediaDir = path.join(dataDir, 'media');
  const migrationsDir = loadConfig().migrationsDir;

  try {
    const db = openDatabase(dbPath);
    migrate(db, migrationsDir);
    db.prepare(
      `INSERT INTO users (id, email, password_hash, status, created_at, updated_at)
       VALUES (?, ?, ?, 'active', ?, ?)`,
    ).run('user-backup-1', 'backup-fixture@example.com', 'not-a-real-hash', new Date().toISOString(), new Date().toISOString());
    writeFileSync(path.join(mediaDir, 'photo-a.bin'), Buffer.from('fictional-photo-bytes'));
    db.prepare(
      `INSERT INTO media_assets (id, user_id, purpose, storage_key, content_type, byte_size, created_at)
       VALUES (?, ?, 'profile', ?, 'image/jpeg', ?, ?)`,
    ).run('media-1', 'user-backup-1', 'photo-a.bin', 21, new Date().toISOString());
    writeFileSync(path.join(mediaDir, 'orphan.bin'), Buffer.from('orphan'));
    const ledger = mediaLedgerConsistency(db, mediaDir);
    assert.deepEqual(ledger.missingFiles, []);
    assert.deepEqual(ledger.orphanFiles, ['orphan.bin']);
    db.close();

    const created = await createSqliteBackup({ databasePath: dbPath, mediaDir, backupRoot });
    assert.equal(created.manifest.method, 'sqlite_backup_api');
    assert.equal(created.manifest.encryption, 'none_local_only');
    assert.ok(created.manifest.mediaCount >= 1);

    const verified = verifyBackup(created.backupDir);
    assert.equal(verified.ok, true);
    assert.deepEqual(verified.reasons, []);

    const restored = restoreBackup({
      backupDir: created.backupDir,
      destinationDir: restoreDir,
      migrationsDir,
    });
    assert.equal(restored.mediaRestored, created.manifest.mediaCount);
    assert.deepEqual(restored.migrationsApplied, []);
    const check = openDatabase(restored.restoredDatabase);
    try {
      const user = check.prepare(`SELECT email FROM users WHERE id = ?`).get('user-backup-1') as { email: string };
      assert.equal(user.email, 'backup-fixture@example.com');
      check.prepare('PRAGMA foreign_key_check').all();
    } finally {
      check.close();
    }

    assert.throws(() => assertBackupPruneDisabled(), /pruning is disabled/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('assertProductionSafeConfig rejects localhost-only production origins', () => {
  assert.throws(
    () => assertProductionSafeConfig({
      envName: 'production',
      publicOrigin: 'https://mystyle.example',
      secureCookie: true,
      adminToken: PROD_ADMIN,
      retentionCleanupEnabled: false,
      allowedOrigins: ['http://127.0.0.1:3000'],
      liveAiEnabled: false,
    }),
    /non-localhost/,
  );
});

test('cleanup and paid external services stay disabled by default in production profile', () => {
  const config = loadConfig(productionEnv());
  assert.equal(config.retentionCleanupEnabled, false);
  assert.throws(() => loadConfig(productionEnv({ AI_ALLOW_LIVE: 'true' })), /AI_ALLOW_LIVE/);
  assert.throws(() => loadConfig(productionEnv({ TRYON_ALLOW_LIVE: 'true' })), /TRYON_ALLOW_LIVE/);
  assert.throws(() => loadConfig(productionEnv({ PAYMENTS_ENABLED: 'true' })), /Payments/);
});
