import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { Worker } from 'node:worker_threads';
import { loadConfig } from '../src/config.js';
import { migrate, openDatabase } from '../src/db.js';
import { registerAccount } from '../src/domain/accounts.js';
import { allocateCredits } from '../src/domain/membership.js';
import { authHeaders, register, startApi } from './harness.js';

const TOKEN = 'admin-token-for-tests-only';

async function admin(base: string, pathName: string, body?: unknown, method = body ? 'POST' : 'GET') {
  const response = await fetch(`${base}${pathName}`, {
    method,
    headers: { authorization: `Bearer ${TOKEN}`, 'content-type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const payload = await response.json() as Record<string, unknown>;
  return { response, payload };
}

test('plan definitions stay provisional and a new account is free', async () => {
  const api = await startApi({ adminToken: TOKEN });
  try {
    const created = await register(api.base, 'free@example.com');
    const plans = await fetch(`${api.base}/api/plans`, { headers: { cookie: created.cookie } });
    const planBody = await plans.json() as { paymentsEnabled: boolean; plans: { planCode: string; priceStatus: string; allowanceStatus: string; indicativeMonthlyZar: number }[] };
    assert.equal(plans.status, 200);
    assert.equal(planBody.paymentsEnabled, false);
    assert.deepEqual(planBody.plans.map((plan) => plan.planCode), ['FAMILY', 'FREE', 'PERSONAL']);
    assert.equal(planBody.plans.every((plan) => plan.priceStatus === 'provisional' && plan.allowanceStatus === 'unapproved'), true);
    const entitlement = await fetch(`${api.base}/api/entitlements`, { headers: { cookie: created.cookie } });
    const body = await entitlement.json() as { paid: boolean; current: { planCode: string; status: string; featureKeys: string[] } };
    assert.equal(body.paid, false);
    assert.equal(body.current.planCode, 'FREE');
    assert.equal(body.current.status, 'active');
    assert.deepEqual(body.current.featureKeys, ['account.basic']);
  } finally {
    await api.close();
  }
});

test('customers cannot assign plans or grant credits', async () => {
  const api = await startApi({ adminToken: TOKEN });
  try {
    const created = await register(api.base, 'self@example.com');
    const headers = authHeaders(created.cookie, created.body.csrfToken);
    const plan = await fetch(`${api.base}/api/entitlements`, { method: 'POST', headers, body: JSON.stringify({ planCode: 'PERSONAL', status: 'active' }) });
    const grant = await fetch(`${api.base}/api/credits/allocate`, { method: 'POST', headers, body: JSON.stringify({ amount: 20 }) });
    const hidden = await fetch(`${api.base}/api/admin/credits/allocate`, { method: 'POST', headers, body: JSON.stringify({ userId: created.body.userId, amount: 20, periodKey: '2026-10', idempotencyKey: 'nope', reason: 'self' }) });
    assert.equal(plan.status, 403);
    assert.equal((await plan.json() as { code: string }).code, 'paid_plan_forbidden');
    assert.equal(grant.status, 403);
    assert.equal(hidden.status, 401);
    const credits = await fetch(`${api.base}/api/credits`, { headers: { cookie: created.cookie } });
    assert.equal((await credits.json() as { balance: number }).balance, 0);
  } finally {
    await api.close();
  }
});

test('allocations, reservations, settlement, release, and refunds are idempotent', async () => {
  const api = await startApi({ adminToken: TOKEN });
  try {
    const created = await register(api.base, 'ledger@example.com');
    const userId = created.body.userId;
    const first = await admin(api.base, '/api/admin/credits/allocate', { userId, amount: 10, periodKey: '2026-10', idempotencyKey: 'alloc-1', reason: 'Test allocation' });
    const repeat = await admin(api.base, '/api/admin/credits/allocate', { userId, amount: 10, periodKey: '2026-10', idempotencyKey: 'alloc-1', reason: 'Test allocation' });
    const otherKey = await admin(api.base, '/api/admin/credits/allocate', { userId, amount: 10, periodKey: '2026-10', idempotencyKey: 'alloc-2', reason: 'Test allocation' });
    assert.equal(first.payload.balance, 10);
    assert.equal(repeat.payload.duplicate, true);
    assert.equal(repeat.payload.balance, 10);
    assert.equal(otherKey.payload.allocated, false);
    const reserved = await admin(api.base, '/api/admin/credits/reserve', { userId, amount: 4, idempotencyKey: 'hold-1', operationType: 'text', featureKey: 'account.basic', reason: 'Mock text' });
    const reservedAgain = await admin(api.base, '/api/admin/credits/reserve', { userId, amount: 4, idempotencyKey: 'hold-1', operationType: 'text', featureKey: 'account.basic', reason: 'Mock text' });
    assert.equal(reserved.payload.balance, 6);
    assert.equal(reservedAgain.payload.duplicate, true);
    assert.equal(reservedAgain.payload.balance, 6);
    const operationId = String(reserved.payload.operationId);
    const settled = await admin(api.base, '/api/admin/credits/settle', { userId, operationId, outcome: 'success' });
    const settledAgain = await admin(api.base, '/api/admin/credits/settle', { userId, operationId, outcome: 'success' });
    assert.equal(settled.payload.status, 'consumed');
    assert.equal(settled.payload.balance, 6);
    assert.equal(settledAgain.payload.duplicate, true);
    const refund = await admin(api.base, '/api/admin/credits/refund', { userId, operationId, idempotencyKey: 'refund-1', reason: 'Eligible test refund' });
    const refundAgain = await admin(api.base, '/api/admin/credits/refund', { userId, operationId, idempotencyKey: 'refund-1', reason: 'Eligible test refund' });
    assert.equal(refund.payload.balance, 10);
    assert.equal(refundAgain.payload.duplicate, true);
    const held = await admin(api.base, '/api/admin/credits/reserve', { userId, amount: 3, idempotencyKey: 'hold-2', operationType: 'text', featureKey: 'account.basic', reason: 'Will fail' });
    const failed = await admin(api.base, '/api/admin/credits/settle', { userId, operationId: held.payload.operationId, outcome: 'failed' });
    assert.equal(failed.payload.status, 'released');
    assert.equal(failed.payload.balance, 10);
    const short = await admin(api.base, '/api/admin/credits/reserve', { userId, amount: 11, idempotencyKey: 'hold-3', operationType: 'text', featureKey: 'account.basic', reason: 'Too much' });
    assert.equal(short.response.status, 409);
    assert.equal(short.payload.code, 'insufficient_credits');
    const mine = await fetch(`${api.base}/api/credits/history`, { headers: { cookie: created.cookie } });
    const history = await mine.json() as { balance: number; entries: { entryType: string }[] };
    assert.equal(history.balance, 10);
    assert.equal(history.entries.some((entry) => entry.entryType === 'ALLOCATION'), true);
    assert.equal(history.entries.some((entry) => entry.entryType === 'REFUND'), true);
    const check = await admin(api.base, `/api/admin/credits/reconcile?userId=${userId}`);
    assert.equal(check.payload.nonNegative, true);
    assert.equal(check.payload.balance, 10);
  } finally {
    await api.close();
  }
});

test('unknown provider status keeps the hold until it is confirmed not billable', async () => {
  const api = await startApi({ adminToken: TOKEN });
  try {
    const created = await register(api.base, 'unknown@example.com');
    const userId = created.body.userId;
    await admin(api.base, '/api/admin/credits/allocate', { userId, amount: 5, periodKey: '2026-10', idempotencyKey: 'alloc-u', reason: 'Test allocation' });
    const mock = await admin(api.base, '/api/admin/credits/mock', { userId, credits: 2, idempotencyKey: 'mock-unknown', outcome: 'unknown', featureKey: 'account.basic', operationType: 'text' });
    assert.equal((mock.payload.settled as { status: string; refunded: boolean }).status, 'unknown');
    assert.equal((mock.payload.settled as { refunded: boolean }).refunded, false);
    const operationId = String((mock.payload.reserved as { operationId: string }).operationId);
    const blocked = await admin(api.base, '/api/admin/credits/release', { userId, operationId });
    assert.equal(blocked.response.status, 409);
    assert.equal(blocked.payload.code, 'unknown_status');
    const released = await admin(api.base, '/api/admin/credits/release', { userId, operationId, confirmNotBillable: true });
    assert.equal(released.payload.balance, 5);
    const usage = await fetch(`${api.base}/api/usage/summary`, { headers: { cookie: created.cookie } });
    const summary = await usage.json() as { operations: { provider: string; reportedCostMinor: number | null; costStatus: string; operationType: string }[] };
    assert.equal(summary.operations[0].provider, 'mock');
    assert.equal(summary.operations[0].operationType, 'text');
    assert.equal(summary.operations[0].reportedCostMinor, null);
    assert.equal(summary.operations[0].costStatus, 'unavailable');
    const totals = await admin(api.base, '/api/admin/usage');
    assert.equal(Array.isArray(totals.payload.totals), true);
  } finally {
    await api.close();
  }
});

test('expired, cancelled, and unpaid features cannot spend, and accounts stay isolated', async () => {
  const api = await startApi({ adminToken: TOKEN });
  try {
    const first = await register(api.base, 'one@example.com');
    const second = await register(api.base, 'two@example.com');
    await admin(api.base, '/api/admin/credits/allocate', { userId: first.body.userId, amount: 6, periodKey: '2026-10', idempotencyKey: 'alloc-a', reason: 'Test allocation' });
    const other = await fetch(`${api.base}/api/credits`, { headers: { cookie: second.cookie } });
    const otherBody = await other.json() as { balance: number; entries: unknown[] };
    assert.equal(otherBody.balance, 0);
    assert.equal(otherBody.entries.length, 0);
    const image = await admin(api.base, '/api/admin/credits/reserve', { userId: first.body.userId, amount: 1, idempotencyKey: 'image', operationType: 'image', featureKey: 'ai.image', reason: 'Image' });
    assert.equal(image.response.status, 403);
    const child = await admin(api.base, '/api/admin/credits/reserve', { userId: first.body.userId, amount: 1, idempotencyKey: 'child', operationType: 'text', featureKey: 'family.dependent', reason: 'Child' });
    assert.equal(child.response.status, 403);
    assert.equal(child.payload.code, 'dependent_forbidden');
    const expired = await admin(api.base, '/api/admin/entitlements', { userId: first.body.userId, planCode: 'FREE', status: 'expired' });
    assert.equal(expired.payload.paid, false);
    const afterExpiry = await admin(api.base, '/api/admin/credits/reserve', { userId: first.body.userId, amount: 1, idempotencyKey: 'after-expiry', operationType: 'text', featureKey: 'account.basic', reason: 'Expired' });
    assert.equal(afterExpiry.response.status, 403);
    await admin(api.base, '/api/admin/entitlements', { userId: first.body.userId, planCode: 'PERSONAL', status: 'active' });
    const cancelled = await admin(api.base, '/api/admin/entitlements', { userId: first.body.userId, planCode: 'PERSONAL', status: 'cancelled' });
    assert.equal(cancelled.payload.status, 'cancelled');
    const afterCancel = await admin(api.base, '/api/admin/credits/reserve', { userId: first.body.userId, amount: 1, idempotencyKey: 'after-cancel', operationType: 'text', featureKey: 'account.basic', reason: 'Cancelled' });
    assert.equal(afterCancel.response.status, 403);
    const seen = await fetch(`${api.base}/api/entitlements`, { headers: { cookie: first.cookie } });
    const current = await seen.json() as { paid: boolean; current: { planCode: string; status: string } };
    assert.equal(current.paid, false);
    assert.equal(current.current.status, 'cancelled');
    const accounts = await admin(api.base, '/api/admin/accounts');
    assert.equal((accounts.payload.accounts as { userId: string }[]).some((row) => row.userId === second.body.userId), true);
  } finally {
    await api.close();
  }
});

test('monthly allocation stays off until an allowance is approved, and expiry follows the configured policy', async () => {
  const api = await startApi({ adminToken: TOKEN });
  try {
    const created = await register(api.base, 'period@example.com');
    const userId = created.body.userId;
    const blocked = await admin(api.base, '/api/admin/billing/run', {});
    assert.equal((blocked.payload.results as { allocated: boolean }[]).every((row) => row.allocated === false), true);
    api.db.prepare(`UPDATE plan_definitions SET allowance_status = 'approved' WHERE plan_code = 'FREE'`).run();
    const granted = await admin(api.base, '/api/admin/billing/run', {});
    const mine = (granted.payload.results as { userId: string; allocated: boolean }[]).find((row) => row.userId === userId);
    assert.equal(mine?.allocated, true);
    const again = await admin(api.base, '/api/admin/billing/run', {});
    const second = (again.payload.results as { userId: string; allocated: boolean }[]).find((row) => row.userId === userId);
    assert.equal(second?.allocated, false);
    const balance = await fetch(`${api.base}/api/credits`, { headers: { cookie: created.cookie } });
    assert.equal((await balance.json() as { balance: number }).balance, 2);
    await admin(api.base, '/api/admin/entitlements', { userId, planCode: 'PERSONAL', status: 'active' });
    api.db.prepare(`UPDATE plan_definitions SET allowance_status = 'approved' WHERE plan_code = 'PERSONAL'`).run();
    api.clock.value = Date.parse('2026-11-16T12:00:00.000Z');
    const paid = await admin(api.base, '/api/admin/billing/run', {});
    const paidRow = (paid.payload.results as { userId: string; reason: string }[]).find((row) => row.userId === userId);
    assert.equal(paidRow?.reason, 'paid_allocation_disabled');
    await admin(api.base, '/api/admin/entitlements', { userId, planCode: 'FREE', status: 'active' });
    const kept = await admin(api.base, `/api/admin/credits/reconcile?userId=${userId}`);
    assert.equal(kept.payload.balance, 2);
    const undecided = await admin(api.base, '/api/admin/credits/expire', {});
    assert.equal(undecided.payload.expired, 0);
    await admin(api.base, '/api/admin/billing/policy', { expiryPolicy: 'expire_after_period', rolloverPolicy: 'none' });
    await admin(api.base, '/api/admin/credits/allocate', { userId, amount: 3, periodKey: '2026-09', idempotencyKey: 'old-period', reason: 'Expiring test credits' });
    const expired = await admin(api.base, '/api/admin/credits/expire', {});
    assert.equal(expired.payload.expired, 3);
    const finalBalance = await admin(api.base, `/api/admin/credits/reconcile?userId=${userId}`);
    assert.equal(finalBalance.payload.balance, 2);
  } finally {
    await api.close();
  }
});

test('invalid credit values are rejected and a failed mock does not leave a charge', async () => {
  const api = await startApi({ adminToken: TOKEN });
  try {
    const created = await register(api.base, 'invalid@example.com');
    const userId = created.body.userId;
    await admin(api.base, '/api/admin/credits/allocate', { userId, amount: 4, periodKey: '2026-10', idempotencyKey: 'alloc-i', reason: 'Test allocation' });
    for (const amount of [1.5, 0, '4']) {
      const rejected = await admin(api.base, '/api/admin/credits/adjust', { userId, amount, idempotencyKey: `bad-${amount}`, reason: 'Bad value' });
      assert.equal(rejected.response.status, 400);
    }
    const negative = await admin(api.base, '/api/admin/credits/adjust', { userId, amount: -9, idempotencyKey: 'too-low', reason: 'Would go negative' });
    assert.equal(negative.response.status, 409);
    const image = await admin(api.base, '/api/admin/credits/mock', { userId, credits: 2, idempotencyKey: 'mock-image', outcome: 'failed', featureKey: 'ai.image', operationType: 'image' });
    assert.equal(image.response.status, 403);
    const text = await admin(api.base, '/api/admin/credits/mock', { userId, credits: 2, idempotencyKey: 'mock-fail-text', outcome: 'failed', featureKey: 'account.basic', operationType: 'text' });
    assert.equal((text.payload.settled as { status: string }).status, 'released');
    const retry = await admin(api.base, '/api/admin/credits/mock', { userId, credits: 2, idempotencyKey: 'mock-fail-text', outcome: 'success', featureKey: 'account.basic', operationType: 'text' });
    assert.equal((retry.payload.reserved as { duplicate: boolean }).duplicate, true);
    const credits = await fetch(`${api.base}/api/credits`, { headers: { cookie: created.cookie } });
    assert.equal((await credits.json() as { balance: number }).balance, 4);
    const open = await admin(api.base, '/api/admin/credits/reservations?status=reserved');
    assert.deepEqual(open.payload.reservations, []);
  } finally {
    await api.close();
  }
});

test('a concurrent reservation cannot spend the same credits twice', async () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'mystyle-race-'));
  const databasePath = path.join(dir, 'race.sqlite');
  const db = openDatabase(databasePath);
  migrate(db, loadConfig().migrationsDir);
  const now = Date.parse('2026-10-16T12:00:00.000Z');
  const account = registerAccount(db, 'race@example.com', 'correct-horse-12', now, 60_000);
  allocateCredits(db, { userId: account.userId, amount: 10, periodKey: '2026-10', idempotencyKey: 'race-alloc', reason: 'Race allocation' }, now);
  db.exec('BEGIN IMMEDIATE');
  const worker = new Worker(new URL('./credit-race.ts', import.meta.url), {
    execArgv: ['--import', 'tsx'],
    workerData: { databasePath, userId: account.userId },
  });
  const result = new Promise<{ ok: boolean; code?: string }>((resolve, reject) => {
    worker.once('message', resolve);
    worker.once('error', reject);
  });
  await new Promise((resolve) => setTimeout(resolve, 200));
  const held = db.prepare(`SELECT COALESCE(SUM(delta), 0) AS balance FROM credit_ledger WHERE user_id = ?`).get(account.userId) as { balance: number };
  db.prepare(
    `INSERT INTO credit_ledger (id, user_id, delta, operation_ref, reason, created_at, entry_type, operation_id, idempotency_key, resulting_balance)
     VALUES ('race-parent', ?, -8, 'race-parent', 'Parent hold', '2026-10-16T12:00:00.000Z', 'RESERVATION', 'race-parent', 'race-parent', ?)`,
  ).run(account.userId, Number(held.balance) - 8);
  db.exec('COMMIT');
  const message = await result;
  assert.equal(message.ok, false);
  assert.equal(message.code, 'insufficient_credits');
  const balance = db.prepare(`SELECT COALESCE(SUM(delta), 0) AS balance FROM credit_ledger WHERE user_id = ?`).get(account.userId) as { balance: number };
  assert.equal(Number(balance.balance), 2);
  db.close();
});
