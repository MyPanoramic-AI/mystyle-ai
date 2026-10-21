import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { loadConfig } from '../src/config.js';
import { migrate, openDatabase } from '../src/db.js';
import { latestCapturedFor } from '../src/email/localCapture.js';
import { authHeaders, cookieFrom, register, startApi } from './harness.js';

async function latestAction(api: Awaited<ReturnType<typeof startApi>>, email: string, kind: string): Promise<string> {
  const captured = latestCapturedFor(api.db, email, kind);
  assert.ok(captured?.actionPath, `expected captured ${kind} for ${email}`);
  const token = new URL(captured!.actionPath!, 'http://local.test').searchParams.get('token');
  assert.ok(token && token.length >= 20);
  return token!;
}

test('new accounts stay unverified and verification succeeds once', async () => {
  const api = await startApi({ emailCaptureEnabled: true, appEnv: 'test' });
  try {
    const email = 'verify-once@example.com';
    const created = await register(api.base, email);
    assert.equal(created.response.status, 201);
    assert.equal(created.body.emailVerified, false);
    const status = await fetch(`${api.base}/api/auth/email-status`, { headers: { cookie: created.cookie } });
    assert.equal((await status.json() as { emailVerified: boolean }).emailVerified, false);

    const token = await latestAction(api, email, 'email_verification');
    const text = JSON.stringify(created.body);
    assert.equal(text.includes(token), false);

    const confirm = await fetch(`${api.base}/api/auth/verify-email/confirm`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token }),
    });
    assert.equal(confirm.status, 200);
    assert.equal((await confirm.json() as { emailVerified: boolean }).emailVerified, true);

    const reused = await fetch(`${api.base}/api/auth/verify-email/confirm`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token }),
    });
    assert.equal(reused.status, 400);
    assert.equal((await reused.json() as { code: string }).code, 'token_used');

    const session = await fetch(`${api.base}/api/auth/session`, { headers: { cookie: created.cookie } });
    assert.equal((await session.json() as { emailVerified: boolean }).emailVerified, true);
  } finally {
    await api.close();
  }
});

test('expired and invalid verification tokens are rejected without leaking secrets', async () => {
  const api = await startApi({ emailCaptureEnabled: true, appEnv: 'test', verificationTokenMs: 1 });
  try {
    const email = 'verify-expiry@example.com';
    const created = await register(api.base, email);
    const token = await latestAction(api, email, 'email_verification');
    api.clock.value += 60_000;
    const expired = await fetch(`${api.base}/api/auth/verify-email/confirm`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token }),
    });
    const body = await expired.json() as { code: string; message: string };
    assert.equal(expired.status, 400);
    assert.equal(body.code, 'token_expired');
    assert.equal(JSON.stringify(body).includes(token), false);

    const invalid = await fetch(`${api.base}/api/auth/verify-email/confirm`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token: 'a'.repeat(40) }),
    });
    assert.equal(invalid.status, 400);
    assert.equal((await invalid.json() as { code: string }).code, 'invalid_token');
    assert.ok(created.body.userId);
  } finally {
    await api.close();
  }
});

test('resend supersedes prior verification tokens and is rate limited with auth limiter', async () => {
  const api = await startApi({ emailCaptureEnabled: true, appEnv: 'test', authRateLimit: 500 });
  try {
    const email = 'verify-resend@example.com';
    const created = await register(api.base, email);
    const first = await latestAction(api, email, 'email_verification');
    api.clock.value += 1_000;
    const resend = await fetch(`${api.base}/api/auth/verify-email/request`, {
      method: 'POST',
      headers: authHeaders(created.cookie, created.body.csrfToken),
    });
    assert.equal(resend.status, 200);
    const second = await latestAction(api, email, 'email_verification');
    assert.notEqual(first, second);
    const old = await fetch(`${api.base}/api/auth/verify-email/confirm`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token: first }),
    });
    assert.equal(old.status, 400);
    const ok = await fetch(`${api.base}/api/auth/verify-email/confirm`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token: second }),
    });
    assert.equal(ok.status, 200);
  } finally {
    await api.close();
  }
});

test('concurrent verification attempts consume the token once', async () => {
  const api = await startApi({ emailCaptureEnabled: true, appEnv: 'test' });
  try {
    const email = 'verify-race@example.com';
    await register(api.base, email);
    const token = await latestAction(api, email, 'email_verification');
    const results = await Promise.all([
      fetch(`${api.base}/api/auth/verify-email/confirm`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ token }) }),
      fetch(`${api.base}/api/auth/verify-email/confirm`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ token }) }),
    ]);
    const statuses = results.map((item) => item.status).sort();
    assert.deepEqual(statuses, [200, 400]);
  } finally {
    await api.close();
  }
});

test('password reset is neutral for unknown emails and completes for known accounts', async () => {
  const api = await startApi({ emailCaptureEnabled: true, appEnv: 'test' });
  try {
    const known = 'reset-known@example.com';
    const first = await register(api.base, known);
    const unknown = await fetch(`${api.base}/api/auth/password-reset/request`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'missing-person@example.com' }),
    });
    const knownReq = await fetch(`${api.base}/api/auth/password-reset/request`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: known }),
    });
    assert.equal(unknown.status, 200);
    assert.equal(knownReq.status, 200);
    const unknownBody = await unknown.json() as { message: string };
    const knownBody = await knownReq.json() as { message: string };
    assert.equal(unknownBody.message, knownBody.message);

    const token = await latestAction(api, known, 'password_reset');
    const reset = await fetch(`${api.base}/api/auth/password-reset/confirm`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token, password: 'new-correct-horse' }),
    });
    assert.equal(reset.status, 200);

    const oldLogin = await fetch(`${api.base}/api/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: known, password: 'correct-horse-12' }),
    });
    assert.equal(oldLogin.status, 401);

    const sessionCheck = await fetch(`${api.base}/api/auth/session`, { headers: { cookie: first.cookie } });
    assert.equal(sessionCheck.status, 401);

    const newLogin = await fetch(`${api.base}/api/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: known, password: 'new-correct-horse' }),
    });
    assert.equal(newLogin.status, 200);
    assert.ok(cookieFrom(newLogin));

    const reused = await fetch(`${api.base}/api/auth/password-reset/confirm`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token, password: 'another-horse-99' }),
    });
    assert.equal(reused.status, 400);
  } finally {
    await api.close();
  }
});

test('expired invalid short passwords and concurrent resets are rejected', async () => {
  const api = await startApi({ emailCaptureEnabled: true, appEnv: 'test', resetTokenMs: 1 });
  try {
    const email = 'reset-edge@example.com';
    await register(api.base, email);
    await fetch(`${api.base}/api/auth/password-reset/request`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const token = await latestAction(api, email, 'password_reset');
    api.clock.value += 120_000;
    const expired = await fetch(`${api.base}/api/auth/password-reset/confirm`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token, password: 'long-enough-pass' }),
    });
    assert.equal((await expired.json() as { code: string }).code, 'token_expired');

    api.clock.value += 1_000;
    await fetch(`${api.base}/api/auth/password-reset/request`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const fresh = await latestAction(api, email, 'password_reset');
    const short = await fetch(`${api.base}/api/auth/password-reset/confirm`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token: fresh, password: 'short' }),
    });
    assert.equal((await short.json() as { code: string }).code, 'invalid_password');

    api.clock.value += 1_000;
    await fetch(`${api.base}/api/auth/password-reset/request`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const raceToken = await latestAction(api, email, 'password_reset');
    const firstRace = await fetch(`${api.base}/api/auth/password-reset/confirm`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token: raceToken, password: 'race-winner-12' }),
    });
    const secondRace = await fetch(`${api.base}/api/auth/password-reset/confirm`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token: raceToken, password: 'race-loser-123' }),
    });
    assert.equal(firstRace.status, 200);
    assert.equal(secondRace.status, 400);
  } finally {
    await api.close();
  }
});

test('existing accounts stay unverified after migration 010 and mailbox hides tokens in the list', async () => {
  const root = mkdtempSync(path.join(tmpdir(), 'mystyle-email-migrate-'));
  const migrationsDir = loadConfig().migrationsDir;
  try {
    const db = openDatabase(path.join(root, 'prior.sqlite'));
    const early = [
      '001_initial.sql', '002_profile_details.sql', '003_ai_conversations.sql', '004_ai_usage_duration.sql',
      '005_wardrobe_planner.sql', '006_family_plans.sql', '007_beauty_studio.sql', '008_membership_accounting.sql',
      '009_privacy_controls.sql',
    ];
    db.exec(`CREATE TABLE IF NOT EXISTS schema_migrations (version TEXT PRIMARY KEY, applied_at TEXT NOT NULL)`);
    for (const file of early) {
      db.exec(readFileSync(path.join(migrationsDir, file), 'utf8'));
      db.prepare('INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)').run(file, new Date().toISOString());
    }
    db.prepare(
      `INSERT INTO users (id, email, password_hash, status, created_at, updated_at)
       VALUES (?, ?, ?, 'active', ?, ?)`,
    ).run('legacy-user', 'legacy@example.com', 'scrypt$not$real', new Date().toISOString(), new Date().toISOString());
    const applied = migrate(db, migrationsDir);
    assert.deepEqual(applied, ['010_email_account_security.sql']);
    const row = db.prepare(`SELECT email_verified_at AS verifiedAt FROM users WHERE id = ?`).get('legacy-user') as { verifiedAt: string | null };
    assert.equal(row.verifiedAt, null);
    db.close();

    const api = await startApi({ emailCaptureEnabled: true, appEnv: 'test' });
    try {
      const email = 'mailbox@example.com';
      await register(api.base, email);
      const listed = await fetch(`${api.base}/api/dev/mailbox`);
      assert.equal(listed.status, 200);
      const payload = await listed.json() as { messages: { id: string; subject: string }[] };
      assert.ok(payload.messages.length >= 1);
      assert.equal(JSON.stringify(payload).includes('token='), false);
      const action = await fetch(`${api.base}/api/dev/mailbox/${payload.messages[0].id}/action`);
      assert.equal(action.status, 200);
      assert.match((await action.json() as { path: string }).path, /token=/);
    } finally {
      await api.close();
    }
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('sensitive export can require verified email when configured', async () => {
  const api = await startApi({ emailCaptureEnabled: true, appEnv: 'test', requireVerifiedForSensitive: true });
  try {
    const created = await register(api.base, 'gated@example.com');
    const blocked = await fetch(`${api.base}/api/privacy/export`, {
      method: 'POST',
      headers: authHeaders(created.cookie, created.body.csrfToken),
      body: JSON.stringify({ password: 'correct-horse-12' }),
    });
    assert.equal(blocked.status, 403);
    assert.equal((await blocked.json() as { code: string }).code, 'email_unverified');
  } finally {
    await api.close();
  }
});

test('disabled mailer does not send and capture stays off in production profile config', () => {
  assert.throws(
    () => loadConfig({
      APP_ENV: 'production',
      API_HOST: '0.0.0.0',
      API_PUBLIC_ORIGIN: 'https://mystyle.example',
      API_ALLOWED_ORIGINS: 'https://mystyle.example',
      API_ADMIN_TOKEN: 'email-security-admin-token',
      EMAIL_CAPTURE_ENABLED: 'true',
    }),
    /EMAIL_CAPTURE_ENABLED/,
  );
});
