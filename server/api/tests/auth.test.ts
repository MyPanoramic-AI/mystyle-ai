import assert from 'node:assert/strict';
import test from 'node:test';
import { authHeaders, register, startApi } from './harness.js';

test('registration, login, logout, expiry, and protected routes', async () => {
  const api = await startApi({ sessionMs: 60_000 });
  try {
    const created = await register(api.base, 'Ada@Example.com');
    assert.equal(created.response.status, 201);
    assert.equal(created.body.userId.length > 10, true);
    assert.equal(created.cookie.includes('mystyle_session='), true);
    assert.equal(JSON.stringify(created.body).includes(created.cookie.split('=')[1] ?? 'missing'), false);

    const session = await fetch(`${api.base}/api/auth/session`, { headers: { cookie: created.cookie } });
    assert.equal(session.status, 200);

    const loggedOut = await fetch(`${api.base}/api/auth/logout`, {
      method: 'POST',
      headers: authHeaders(created.cookie, created.body.csrfToken),
    });
    assert.equal(loggedOut.status, 200);
    const after = await fetch(`${api.base}/api/auth/session`, { headers: { cookie: created.cookie } });
    assert.equal(after.status, 401);

    const login = await fetch(`${api.base}/api/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'ada@example.com', password: 'correct-horse-12' }),
    });
    const loginBody = await login.json() as { csrfToken: string };
    assert.equal(login.status, 200);
    api.clock.value += 60_000;
    const expired = await fetch(`${api.base}/api/auth/session`, { headers: { cookie: login.headers.getSetCookie()[0]?.split(';')[0] ?? '' } });
    assert.equal(expired.status, 401);
    assert.equal(typeof loginBody.csrfToken, 'string');

    const missing = await fetch(`${api.base}/api/profile`);
    assert.equal(missing.status, 401);
  } finally {
    await api.close();
  }
});

test('invalid credentials share one response and duplicates are rejected', async () => {
  const api = await startApi();
  try {
    await register(api.base, 'ada@example.com');
    const unknown = await fetch(`${api.base}/api/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'missing@example.com', password: 'correct-horse-12' }),
    });
    const wrong = await fetch(`${api.base}/api/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'ada@example.com', password: 'wrong-password-12' }),
    });
    const unknownBody = await unknown.json() as { code: string; message: string };
    const wrongBody = await wrong.json() as { code: string; message: string };
    assert.equal(unknown.status, 401);
    assert.equal(wrong.status, 401);
    assert.equal(unknownBody.code, wrongBody.code);
    assert.equal(unknownBody.message, wrongBody.message);
    const duplicate = await register(api.base, 'ada@example.com');
    assert.equal(duplicate.response.status, 409);
    assert.equal(duplicate.body.code, 'duplicate_email');
    const short = await register(api.base, 'new@example.com', 'short');
    assert.equal(short.response.status, 400);
    const malformed = await register(api.base, 'not-an-email', 'correct-horse-12');
    assert.equal(malformed.response.status, 400);
  } finally {
    await api.close();
  }
});

test('a disabled account cannot sign in', async () => {
  const api = await startApi();
  try {
    const created = await register(api.base, 'ada@example.com');
    api.db.prepare(`UPDATE users SET status = 'disabled' WHERE id = ?`).run(created.body.userId);
    const login = await fetch(`${api.base}/api/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'ada@example.com', password: 'correct-horse-12' }),
    });
    const body = await login.json() as { code: string };
    assert.equal(login.status, 403);
    assert.equal(body.code, 'account_disabled');
  } finally {
    await api.close();
  }
});

test('authentication attempts are rate limited', async () => {
  const api = await startApi({ authRateLimit: 2, authRateWindowMs: 60_000 });
  try {
    const first = await register(api.base, 'one@example.com');
    const second = await register(api.base, 'two@example.com');
    const third = await register(api.base, 'three@example.com');
    assert.equal(first.response.status, 201);
    assert.equal(second.response.status, 201);
    assert.equal(third.response.status, 429);
  } finally {
    await api.close();
  }
});

test('a foreign browser origin is rejected', async () => {
  const api = await startApi();
  try {
    const response = await fetch(`${api.base}/api/auth/login`, {
      method: 'POST',
      headers: { origin: 'https://evil.example', 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'ada@example.com', password: 'correct-horse-12' }),
    });
    assert.equal(response.status, 403);
  } finally {
    await api.close();
  }
});

test('the audit route stays disabled unless an admin token is configured', async () => {
  const api = await startApi();
  try {
    const disabled = await fetch(`${api.base}/api/admin/audit`);
    assert.equal(disabled.status, 503);
  } finally {
    await api.close();
  }
  const enabled = await startApi({ adminToken: 'admin-token-for-tests-only' });
  try {
    const wrong = await fetch(`${enabled.base}/api/admin/audit`, { headers: { authorization: 'Bearer wrong-token-value' } });
    assert.equal(wrong.status, 401);
    const right = await fetch(`${enabled.base}/api/admin/audit`, { headers: { authorization: 'Bearer admin-token-for-tests-only' } });
    assert.equal(right.status, 200);
  } finally {
    await enabled.close();
  }
});
