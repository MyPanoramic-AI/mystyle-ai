import assert from 'node:assert/strict';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { authHeaders, register, startApi } from './harness.js';
import { loadConfig } from '../src/config.js';
import { migrate, openDatabase } from '../src/db.js';
import { registerAccount } from '../src/domain/accounts.js';
import { allocateCredits } from '../src/domain/membership.js';
import { saveMedia } from '../src/media/store.js';
import { confirmDeletion, startDeletionRequest } from '../src/privacy/deletion.js';
import { createStoreZip } from '../src/privacy/zip.js';

const TOKEN = 'admin-token-for-tests-only';
const PASSWORD = 'correct-horse-12';
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);

function parseZipJson(bytes: Buffer, name: string): Record<string, unknown> {
  // Store-method ZIP: locate the local file header for the named entry.
  const marker = Buffer.from(name, 'utf8');
  let index = 0;
  while (index < bytes.length) {
    if (bytes.readUInt32LE(index) !== 0x04034b50) break;
    const nameLen = bytes.readUInt16LE(index + 26);
    const extraLen = bytes.readUInt16LE(index + 28);
    const size = bytes.readUInt32LE(index + 18);
    const entryName = bytes.subarray(index + 30, index + 30 + nameLen).toString('utf8');
    const start = index + 30 + nameLen + extraLen;
    const data = bytes.subarray(start, start + size);
    if (entryName === name) return JSON.parse(data.toString('utf8')) as Record<string, unknown>;
    index = start + size;
  }
  throw new Error(`missing ${name}`);
}

test('optional consent defaults off and records grant plus withdrawal history', async () => {
  const api = await startApi({ adminToken: TOKEN });
  try {
    const created = await register(api.base, 'consent@example.com');
    const headers = authHeaders(created.cookie, created.body.csrfToken);
    const initial = await fetch(`${api.base}/api/privacy/consent`, { headers: { cookie: created.cookie } });
    const body = await initial.json() as { current: { purpose: string; granted: boolean }[]; history: unknown[] };
    assert.equal(initial.status, 200);
    assert.equal(body.current.every((row) => row.granted === false), true);
    assert.equal(body.history.length >= 4, true);
    const grant = await fetch(`${api.base}/api/privacy/consent`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ purpose: 'ai_personalisation', granted: true, captureMethod: 'settings_toggle' }),
    });
    const granted = await grant.json() as { current: { purpose: string; granted: boolean }[] };
    assert.equal(granted.current.find((row) => row.purpose === 'ai_personalisation')?.granted, true);
    const prefs = await fetch(`${api.base}/api/preferences`, { headers: { cookie: created.cookie } });
    assert.equal((await prefs.json() as { aiPersonalisationConsent: boolean }).aiPersonalisationConsent, true);
    const withdraw = await fetch(`${api.base}/api/privacy/consent`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ purpose: 'ai_personalisation', granted: false, captureMethod: 'settings_toggle' }),
    });
    const withdrawn = await withdraw.json() as { current: { purpose: string; granted: boolean }[]; history: { status: string }[] };
    assert.equal(withdrawn.current.find((row) => row.purpose === 'ai_personalisation')?.granted, false);
    assert.equal(withdrawn.history.some((row) => row.status === 'granted'), true);
    assert.equal(withdrawn.history.some((row) => row.status === 'withdrawn'), true);
    const notice = await fetch(`${api.base}/api/privacy/notice`, { headers: { cookie: created.cookie } });
    assert.equal((await notice.json() as { status: string }).status, 'draft');
  } finally {
    await api.close();
  }
});

test('authenticated export includes owned records, excludes secrets, and isolates accounts', async () => {
  const api = await startApi({ adminToken: TOKEN });
  try {
    const first = await register(api.base, 'export-a@example.com');
    const second = await register(api.base, 'export-b@example.com');
    const headers = authHeaders(first.cookie, first.body.csrfToken);
    await fetch(`${api.base}/api/profile`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ displayName: 'Export Ada', styles: ['classic'], sizes: { tops: 'M' }, budgetTier: 'flexible' }),
    });
    await fetch(`${api.base}/api/media`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ purpose: 'wardrobe', imageBase64: PNG.toString('base64') }),
    });
    await fetch(`${api.base}/api/admin/credits/allocate`, {
      method: 'POST',
      headers: { authorization: `Bearer ${TOKEN}`, 'content-type': 'application/json' },
      body: JSON.stringify({ userId: first.body.userId, amount: 4, periodKey: '2026-10', idempotencyKey: 'privacy-alloc', reason: 'Export test' }),
    });
    const denied = await fetch(`${api.base}/api/privacy/export`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ password: 'wrong-password-here' }),
    });
    assert.equal(denied.status, 401);
    const created = await fetch(`${api.base}/api/privacy/export`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ password: PASSWORD }),
    });
    const exportBody = await created.json() as { exportId: string; status: string };
    assert.equal(created.status, 201);
    assert.equal(exportBody.status, 'ready');
    const download = await fetch(`${api.base}/api/privacy/export/${exportBody.exportId}/download`, { headers: { cookie: first.cookie } });
    assert.equal(download.status, 200);
    const bytes = Buffer.from(await download.arrayBuffer());
    const account = parseZipJson(bytes, 'account.json');
    const text = JSON.stringify(account);
    assert.equal((account.profile as { displayName: string }).displayName, 'Export Ada');
    assert.equal(Array.isArray(account.creditLedger), true);
    assert.equal((account.creditLedger as unknown[]).length > 0, true);
    assert.equal(text.includes('scrypt$'), false);
    assert.equal(text.includes('"passwordHash"'), false);
    assert.equal(text.includes(TOKEN), false);
    assert.equal(Object.prototype.hasOwnProperty.call(account.account as object, 'passwordHash'), false);
    assert.equal(text.includes('export-b@example.com'), false);
    const foreign = await fetch(`${api.base}/api/privacy/export/${exportBody.exportId}/download`, { headers: { cookie: second.cookie } });
    assert.equal(foreign.status, 404);
    api.clock.value += 2 * 60 * 60 * 1000;
    const expired = await fetch(`${api.base}/api/privacy/export/${exportBody.exportId}/download`, { headers: { cookie: first.cookie } });
    assert.equal(expired.status, 410);
  } finally {
    await api.close();
  }
});

test('account deletion requires reauthentication, can be cancelled, and cleans owned data', async () => {
  const api = await startApi({ adminToken: TOKEN });
  try {
    const victim = await register(api.base, 'delete-me@example.com');
    const survivor = await register(api.base, 'keep-me@example.com');
    const headers = authHeaders(victim.cookie, victim.body.csrfToken);
    await fetch(`${api.base}/api/profile`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ displayName: 'Delete Me', styles: ['classic'], sizes: { tops: 'S' }, budgetTier: 'flexible' }),
    });
    const media = await fetch(`${api.base}/api/media`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ purpose: 'profile', imageBase64: PNG.toString('base64') }),
    });
    const mediaBody = await media.json() as { id: string };
    await fetch(`${api.base}/api/admin/credits/allocate`, {
      method: 'POST',
      headers: { authorization: `Bearer ${TOKEN}`, 'content-type': 'application/json' },
      body: JSON.stringify({ userId: victim.body.userId, amount: 5, periodKey: '2026-10', idempotencyKey: 'del-alloc', reason: 'Retain ledger' }),
    });
    const started = await fetch(`${api.base}/api/privacy/deletion/start`, { method: 'POST', headers });
    assert.equal(started.status, 201);
    const cancelled = await fetch(`${api.base}/api/privacy/deletion/cancel`, { method: 'POST', headers });
    assert.equal(cancelled.status, 200);
    const stillHere = await fetch(`${api.base}/api/profile`, { headers: { cookie: victim.cookie } });
    assert.equal((await stillHere.json() as { displayName: string }).displayName, 'Delete Me');
    await fetch(`${api.base}/api/privacy/deletion/start`, { method: 'POST', headers });
    const wrong = await fetch(`${api.base}/api/privacy/deletion/confirm`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ password: 'incorrect-pass' }),
    });
    assert.equal(wrong.status, 401);
    const confirmed = await fetch(`${api.base}/api/privacy/deletion/confirm`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ password: PASSWORD }),
    });
    assert.equal(confirmed.status, 200);
    const login = await fetch(`${api.base}/api/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'delete-me@example.com', password: PASSWORD }),
    });
    assert.equal(login.status, 401);
    const mediaGone = await fetch(`${api.base}/api/media/${mediaBody.id}`, { headers: { cookie: victim.cookie } });
    assert.equal(mediaGone.status, 401);
    const ledger = api.db.prepare(`SELECT COUNT(*) AS count FROM credit_ledger WHERE user_id = ?`).get(victim.body.userId) as { count: number };
    assert.equal(Number(ledger.count) > 0, true);
    const profile = api.db.prepare(`SELECT COUNT(*) AS count FROM customer_profiles WHERE user_id = ?`).get(victim.body.userId) as { count: number };
    assert.equal(Number(profile.count), 0);
    const other = await fetch(`${api.base}/api/auth/session`, { headers: { cookie: survivor.cookie } });
    assert.equal(other.status, 200);
    assert.equal((await other.json() as { email: string }).email, 'keep-me@example.com');
    const foreignStatus = await fetch(`${api.base}/api/privacy/deletion`, { headers: { cookie: survivor.cookie } });
    assert.equal((await foreignStatus.json() as { request: null }).request, null);
  } finally {
    await api.close();
  }
});

test('retention dry run reports actions without deleting, and destructive cleanup stays off', async () => {
  const api = await startApi({ adminToken: TOKEN, retentionCleanupEnabled: false });
  try {
    const created = await register(api.base, 'retain@example.com');
    const preview = await fetch(`${api.base}/api/privacy/retention/preview`, { headers: { cookie: created.cookie } });
    const body = await preview.json() as { mode: string; destructiveCleanupEnabled: boolean };
    assert.equal(body.mode, 'dry_run');
    assert.equal(body.destructiveCleanupEnabled, false);
    const blocked = await fetch(`${api.base}/api/admin/retention/cleanup`, {
      method: 'POST',
      headers: { authorization: `Bearer ${TOKEN}`, 'content-type': 'application/json' },
      body: JSON.stringify({ confirmDestructive: true }),
    });
    assert.equal(blocked.status, 403);
    const dry = await fetch(`${api.base}/api/admin/retention/dry-run`, {
      method: 'POST',
      headers: { authorization: `Bearer ${TOKEN}`, 'content-type': 'application/json' },
      body: '{}',
    });
    assert.equal(dry.status, 200);
    assert.equal((await dry.json() as { mode: string }).mode, 'dry_run');
  } finally {
    await api.close();
  }
});

test('zip helper and failed deletion retry stay idempotent for cleanup', async () => {
  const zip = createStoreZip([{ name: 'hello.txt', data: Buffer.from('hello') }]);
  assert.equal(zip.readUInt32LE(0), 0x04034b50);
  const dir = path.join(tmpdir(), `mystyle-privacy-${Date.now()}`);
  mkdirSync(path.join(dir, 'media'), { recursive: true });
  mkdirSync(path.join(dir, 'exports'), { recursive: true });
  const db = openDatabase(path.join(dir, 'test.sqlite'));
  migrate(db, loadConfig().migrationsDir);
  const now = Date.parse('2026-10-16T12:00:00.000Z');
  const account = registerAccount(db, 'retry@example.com', PASSWORD, now, 60_000);
  allocateCredits(db, { userId: account.userId, amount: 2, periodKey: '2026-10', idempotencyKey: 'r1', reason: 'keep' }, now);
  const saved = saveMedia({
    db,
    mediaDir: path.join(dir, 'media'),
    userId: account.userId,
    bytes: PNG,
    purpose: 'wardrobe',
    now,
    maxBytes: 1_000_000,
    retentionMs: 86_400_000,
  });
  assert.equal(existsSync(path.join(dir, 'media', `${saved.id}.img`)), true);
  startDeletionRequest(db, account.userId, now);
  const first = confirmDeletion(db, {
    userId: account.userId,
    password: PASSWORD,
    mediaDir: path.join(dir, 'media'),
    exportsDir: path.join(dir, 'exports'),
  }, now);
  assert.equal(first.status, 'completed');
  assert.equal(existsSync(path.join(dir, 'media', `${saved.id}.img`)), false);
  const user = db.prepare(`SELECT status, email FROM users WHERE id = ?`).get(account.userId) as { status: string; email: string };
  assert.equal(user.status, 'deleted');
  assert.equal(user.email.includes('@deleted.invalid'), true);
  const ledger = db.prepare(`SELECT COUNT(*) AS count FROM credit_ledger WHERE user_id = ?`).get(account.userId) as { count: number };
  assert.equal(Number(ledger.count), 1);
  db.close();
});
