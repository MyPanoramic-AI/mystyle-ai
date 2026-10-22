import { randomUUID } from 'node:crypto';
import { ApiError } from '../errors.js';
import type { Sql } from '../db.js';

const PLAN_CODES = ['FREE', 'PERSONAL', 'FAMILY'] as const;
const STATUSES = ['inactive', 'active', 'cancelled', 'expired'] as const;
const ENTRY_TYPES = ['ALLOCATION', 'RESERVATION', 'CONSUMPTION', 'RELEASE', 'REFUND', 'EXPIRATION', 'ADMIN_ADJUSTMENT'] as const;

export type PlanCode = (typeof PLAN_CODES)[number];
export type EntitlementStatus = (typeof STATUSES)[number];

const PAID_PLANS = new Set<PlanCode>(['PERSONAL', 'FAMILY']);

export function grantFreeEntitlement(db: Sql, userId: string, now: number): void {
  const existing = db.prepare(`SELECT id FROM subscription_entitlements WHERE user_id = ?`).get(userId);
  if (existing) return;
  const plan = publishedPlan(db, 'FREE');
  const stamp = new Date(now).toISOString();
  try {
    db.prepare(
      `INSERT INTO subscription_entitlements (
        id, user_id, plan_code, status, effective_from, effective_to, plan_version, entitlement_version, feature_keys_json, source, updated_at
      ) VALUES (?, ?, 'FREE', 'active', ?, NULL, ?, 1, ?, 'registration', ?)`,
    ).run(randomUUID(), userId, stamp, plan.version, plan.entitlementKeysJson, stamp);
  } catch (error) {
    if (!String(error).includes('UNIQUE')) throw error;
  }
}

export function listPlans(db: Sql) {
  return (db.prepare(
    `SELECT id, plan_code AS planCode, version, display_name AS displayName,
            indicative_monthly_zar AS indicativeMonthlyZar, billing_interval AS billingInterval,
            features_json AS featuresJson, proposed_monthly_credits AS proposedMonthlyCredits,
            allowance_status AS allowanceStatus, family_capable AS familyCapable,
            price_status AS priceStatus, status, effective_from AS effectiveFrom, retired_on AS retiredOn
     FROM plan_definitions WHERE status = 'published' ORDER BY version, plan_code`,
  ).all() as Record<string, unknown>[]).map((row) => ({
    ...row,
    familyCapable: row.familyCapable === 1,
    features: JSON.parse(String(row.featuresJson)),
    featuresJson: undefined,
    priceNote: 'Provisional. This is not a live offer and does not start a paid subscription.',
    allowanceNote: 'The proposed monthly allowance is not approved and is not granted automatically.',
  }));
}

export function readEntitlement(db: Sql, userId: string, now: number) {
  grantFreeEntitlement(db, userId, now);
  const row = db.prepare(
    `SELECT id, plan_code AS planCode, status, effective_from AS effectiveFrom, effective_to AS effectiveTo,
            plan_version AS planVersion, entitlement_version AS entitlementVersion, feature_keys_json AS featureKeysJson, source
     FROM subscription_entitlements WHERE user_id = ?
     ORDER BY CASE status WHEN 'active' THEN 0 ELSE 1 END, effective_from DESC LIMIT 1`,
  ).get(userId) as Record<string, unknown> | undefined;
  if (!row) return { entitlement: null, paid: false };
  return {
    entitlement: {
      ...row,
      featureKeys: JSON.parse(String(row.featureKeysJson)),
      featureKeysJson: undefined,
      paid: false,
    },
    paid: false,
  };
}

export function readCredits(db: Sql, userId: string) {
  const balance = postedBalance(db, userId);
  const entries = db.prepare(
    `SELECT id, entry_type AS entryType, delta, operation_id AS operationId, reason, resulting_balance AS resultingBalance, created_at AS createdAt
     FROM credit_ledger WHERE user_id = ? ORDER BY created_at, rowid`,
  ).all(userId);
  return {
    balance,
    unit: 'test_credit',
    label: 'Test credits. These are not a paid balance and do not equal a provider charge.',
    entries,
  };
}

export function readUsage(db: Sql, userId: string) {
  const operations = db.prepare(
    `SELECT operation_id AS operationId, provider, model, operation_type AS operationType,
            credits_consumed AS creditsConsumed, usage_units AS usageUnits, usage_unit AS usageUnit,
            currency, reported_cost_minor AS reportedCostMinor, estimated_cost_minor AS estimatedCostMinor,
            cost_status AS costStatus, request_status AS requestStatus, created_at AS createdAt
     FROM provider_costs WHERE user_id = ? ORDER BY created_at`,
  ).all(userId);
  return { operations, note: 'Customer credits and provider costs are separate. No provider cost is invented.' };
}

export function assignEntitlement(
  db: Sql,
  input: { userId: string; planCode: string; status: string; effectiveTo?: string | null; actor: string },
  now: number,
) {
  const planCode = assertPlan(input.planCode);
  const status = assertStatus(input.status);
  if (PAID_PLANS.has(planCode) && input.actor !== 'admin') {
    throw new ApiError('paid_plan_forbidden', 'A customer cannot assign a paid plan.', 403);
  }
  const plan = publishedPlan(db, planCode);
  const stamp = new Date(now).toISOString();
  return withTx(db, () => {
    db.prepare(
      `UPDATE subscription_entitlements SET status = 'cancelled', updated_at = ? WHERE user_id = ? AND status = 'active'`,
    ).run(stamp, input.userId);
    const id = randomUUID();
    db.prepare(
      `INSERT INTO subscription_entitlements (
        id, user_id, plan_code, status, effective_from, effective_to, plan_version, entitlement_version, feature_keys_json, source, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)`,
    ).run(
      id,
      input.userId,
      planCode,
      status,
      stamp,
      input.effectiveTo ?? null,
      plan.version,
      status === 'active' ? plan.entitlementKeysJson : '[]',
      input.actor === 'admin' ? 'admin_test' : 'registration',
      stamp,
    );
    audit(db, 'entitlement_assigned', input.actor === 'admin' ? null : input.userId, id, {
      userId: input.userId,
      planCode,
      status,
      paid: false,
    }, stamp);
    return { id, planCode, status, paid: false, source: 'admin_test' };
  });
}

export function allocateCredits(
  db: Sql,
  input: { userId: string; amount: unknown; periodKey: string; idempotencyKey: string; reason: string },
  now: number,
) {
  const amount = assertUnits(input.amount);
  const periodKey = assertPeriod(input.periodKey);
  return withTx(db, () => {
    const prior = readIdempotency(db, input.userId, 'allocate', input.idempotencyKey);
    if (prior) return { ...prior, duplicate: true, allocated: false };
    const existing = db.prepare(
      `SELECT id, amount FROM allocation_periods WHERE user_id = ? AND period_key = ?`,
    ).get(input.userId, periodKey) as { id: string; amount: number } | undefined;
    if (existing) {
      const body = { allocated: false, duplicate: true, amount: existing.amount, balance: postedBalance(db, input.userId), periodKey };
      writeIdempotency(db, input.userId, 'allocate', input.idempotencyKey, body, now);
      return body;
    }
    const entitlement = activeEntitlement(db, input.userId, now);
    if (!entitlement) throw new ApiError('entitlement_inactive', 'This account has no active entitlement.', 403);
    const policy = currentPolicy(db);
    const expiresOn = policy.expiryPolicy === 'expire_after_period' ? periodEnd(periodKey) : null;
    const id = randomUUID();
    const balance = postedBalance(db, input.userId) + amount;
    const stamp = new Date(now).toISOString();
    db.prepare(
      `INSERT INTO allocation_periods (id, user_id, period_key, plan_code, amount, remaining, expires_on, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(id, input.userId, periodKey, entitlement.planCode, amount, amount, expiresOn, stamp);
    post(db, input.userId, 'ALLOCATION', amount, id, input.idempotencyKey, input.reason, balance, stamp);
    const body = { allocated: true, duplicate: false, amount, balance, periodKey };
    writeIdempotency(db, input.userId, 'allocate', input.idempotencyKey, body, now);
    audit(db, 'credit_allocated', null, id, { userId: input.userId, amount, periodKey }, stamp);
    return body;
  });
}

export function runMonthlyAllocations(db: Sql, now: number) {
  const policy = currentPolicy(db);
  const periodKey = periodKeyFrom(now);
  const rows = db.prepare(
    `SELECT user_id AS userId, plan_code AS planCode, plan_version AS planVersion
     FROM subscription_entitlements WHERE status = 'active'`,
  ).all() as { userId: string; planCode: string; planVersion: number }[];
  const results: { userId: string; allocated: boolean; reason: string }[] = [];
  for (const row of rows) {
    const plan = db.prepare(
      `SELECT allowance_status AS allowanceStatus, proposed_monthly_credits AS proposed FROM plan_definitions WHERE plan_code = ? AND version = ?`,
    ).get(row.planCode, row.planVersion) as { allowanceStatus: string; proposed: number } | undefined;
    if (!plan || plan.allowanceStatus !== 'approved') {
      results.push({ userId: row.userId, allocated: false, reason: 'allowance_not_approved' });
      continue;
    }
    if (PAID_PLANS.has(row.planCode as PlanCode) && policy.paidAllocationEnabled !== 1) {
      results.push({ userId: row.userId, allocated: false, reason: 'paid_allocation_disabled' });
      continue;
    }
    const outcome = allocateCredits(db, {
      userId: row.userId,
      amount: plan.proposed,
      periodKey,
      idempotencyKey: `period:${row.userId}:${periodKey}`,
      reason: `Monthly allocation ${periodKey}`,
    }, now) as { allocated: boolean };
    results.push({ userId: row.userId, allocated: outcome.allocated, reason: outcome.allocated ? 'allocated' : 'already_allocated' });
  }
  return { periodKey, paidAllocationEnabled: policy.paidAllocationEnabled === 1, results };
}

export interface ReservationResult {
  operationId: string;
  reservationId: string;
  amount: number;
  balance: number;
  status: string;
  duplicate: boolean;
}

export function reserveCredits(
  db: Sql,
  input: { userId: string; amount: unknown; idempotencyKey: string; operationType: string; featureKey: string; provider?: string; reason: string },
  now: number,
): ReservationResult {
  const amount = assertUnits(input.amount);
  return withTx(db, () => {
    const prior = readIdempotency(db, input.userId, 'reserve', input.idempotencyKey);
    if (prior) return { ...(prior as unknown as ReservationResult), duplicate: true };
    assertCanSpend(db, input.userId, input.featureKey, now);
    const balance = postedBalance(db, input.userId);
    if (balance < amount) throw new ApiError('insufficient_credits', 'There are not enough test credits for that operation.', 409);
    const operationId = randomUUID();
    const reservationId = randomUUID();
    const stamp = new Date(now).toISOString();
    const next = balance - amount;
    post(db, input.userId, 'RESERVATION', -amount, operationId, input.idempotencyKey, input.reason, next, stamp);
    db.prepare(
      `INSERT INTO credit_reservations (
        id, user_id, operation_id, idempotency_key, amount, status, provider, operation_type, feature_key, reason, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, 'reserved', ?, ?, ?, ?, ?, ?)`,
    ).run(reservationId, input.userId, operationId, input.idempotencyKey, amount, input.provider ?? 'mock', input.operationType, input.featureKey, input.reason, stamp, stamp);
    db.prepare(
      `INSERT INTO provider_costs (
        id, user_id, operation_id, provider, model, operation_type, credits_consumed, usage_units, usage_unit,
        currency, reported_cost_minor, estimated_cost_minor, cost_status, request_status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, NULL, ?, NULL, NULL, NULL, NULL, NULL, NULL, 'unavailable', 'reserved', ?, ?)`,
    ).run(randomUUID(), input.userId, operationId, input.provider ?? 'mock', input.operationType, stamp, stamp);
    const body = { operationId, reservationId, amount, balance: next, status: 'reserved', duplicate: false };
    writeIdempotency(db, input.userId, 'reserve', input.idempotencyKey, body, now);
    return body;
  });
}

export function settleOperation(
  db: Sql,
  input: { userId: string; operationId: string; outcome: string },
  now: number,
) {
  if (!['success', 'failed', 'unknown'].includes(input.outcome)) {
    throw new ApiError('invalid_outcome', 'The operation outcome was not accepted.', 400);
  }
  return withTx(db, () => {
    const reservation = loadReservation(db, input.userId, input.operationId);
    const stamp = new Date(now).toISOString();
    if (input.outcome === 'success') {
      if (reservation.status === 'consumed') return { operationId: reservation.operationId, status: 'consumed', duplicate: true, balance: postedBalance(db, input.userId) };
      if (reservation.status !== 'reserved') throw new ApiError('reservation_closed', 'That reservation cannot be settled.', 409);
      post(db, input.userId, 'CONSUMPTION', 0, reservation.operationId, null, 'Confirmed mock operation', postedBalance(db, input.userId), stamp);
      db.prepare(`UPDATE credit_reservations SET status = 'consumed', updated_at = ? WHERE id = ?`).run(stamp, reservation.id);
      db.prepare(
        `UPDATE provider_costs SET request_status = 'succeeded', credits_consumed = ?, updated_at = ? WHERE operation_id = ?`,
      ).run(reservation.amount, stamp, reservation.operationId);
      reduceAllocation(db, input.userId, reservation.amount);
      return { operationId: reservation.operationId, status: 'consumed', duplicate: false, balance: postedBalance(db, input.userId) };
    }
    if (input.outcome === 'unknown') {
      if (reservation.status === 'unknown') return { operationId: reservation.operationId, status: 'unknown', duplicate: true, balance: postedBalance(db, input.userId) };
      if (reservation.status !== 'reserved') throw new ApiError('reservation_closed', 'That reservation cannot be marked unknown.', 409);
      db.prepare(`UPDATE credit_reservations SET status = 'unknown', updated_at = ? WHERE id = ?`).run(stamp, reservation.id);
      db.prepare(`UPDATE provider_costs SET request_status = 'unknown', updated_at = ? WHERE operation_id = ?`).run(stamp, reservation.operationId);
      return { operationId: reservation.operationId, status: 'unknown', duplicate: false, balance: postedBalance(db, input.userId), refunded: false };
    }
    return releaseReservation(db, reservation, stamp, false);
  });
}

export function releaseReservation(db: Sql, reservation: ReservationRow, stamp: string, confirmNotBillable: boolean): { operationId: string; status: string; duplicate: boolean; balance: number; refunded: boolean } {
  if (reservation.status === 'released') {
    return { operationId: reservation.operationId, status: 'released', duplicate: true, balance: postedBalance(db, reservation.userId), refunded: false };
  }
  if (reservation.status === 'unknown' && !confirmNotBillable) {
    throw new ApiError('unknown_status', 'An unknown provider status was not refunded. Confirm that it cannot still be billed.', 409);
  }
  if (reservation.status === 'consumed') throw new ApiError('already_consumed', 'A settled operation cannot be released.', 409);
  if (reservation.status !== 'reserved' && reservation.status !== 'unknown') {
    throw new ApiError('reservation_closed', 'That reservation cannot be released.', 409);
  }
  const balance = postedBalance(db, reservation.userId) + reservation.amount;
  post(db, reservation.userId, 'RELEASE', reservation.amount, reservation.operationId, null, 'Reservation released', balance, stamp);
  db.prepare(`UPDATE credit_reservations SET status = 'released', updated_at = ? WHERE id = ?`).run(stamp, reservation.id);
  db.prepare(
    `UPDATE provider_costs SET request_status = 'failed', credits_consumed = 0, updated_at = ? WHERE operation_id = ?`,
  ).run(stamp, reservation.operationId);
  return { operationId: reservation.operationId, status: 'released', duplicate: false, balance, refunded: true };
}

export function releaseById(db: Sql, userId: string, operationId: string, confirmNotBillable: boolean, now: number) {
  return withTx(db, () => releaseReservation(db, loadReservation(db, userId, operationId), new Date(now).toISOString(), confirmNotBillable));
}

export function adjustCredits(db: Sql, input: { userId: string; amount: unknown; idempotencyKey: string; reason: string }, now: number) {
  const amount = input.amount;
  if (typeof amount !== 'number' || !Number.isInteger(amount) || amount === 0) {
    throw new ApiError('invalid_credit', 'An adjustment must be a non-zero integer.', 400);
  }
  return withTx(db, () => {
    const prior = readIdempotency(db, input.userId, 'adjust', input.idempotencyKey);
    if (prior) return { ...prior, duplicate: true };
    const next = postedBalance(db, input.userId) + amount;
    if (next < 0) throw new ApiError('negative_balance', 'The ledger cannot go below zero.', 409);
    const stamp = new Date(now).toISOString();
    const id = randomUUID();
    post(db, input.userId, 'ADMIN_ADJUSTMENT', amount, id, input.idempotencyKey, input.reason, next, stamp);
    audit(db, 'credit_adjusted', null, id, { userId: input.userId, amount }, stamp);
    const body = { balance: next, duplicate: false };
    writeIdempotency(db, input.userId, 'adjust', input.idempotencyKey, body, now);
    return body;
  });
}

export function refundConsumed(db: Sql, input: { userId: string; operationId: string; idempotencyKey: string; reason: string }, now: number) {
  return withTx(db, () => {
    const prior = readIdempotency(db, input.userId, 'refund', input.idempotencyKey);
    if (prior) return { ...prior, duplicate: true };
    const reservation = loadReservation(db, input.userId, input.operationId);
    if (reservation.status !== 'consumed') throw new ApiError('not_refundable', 'Only a confirmed consumption can be refunded.', 409);
    const already = db.prepare(
      `SELECT id FROM credit_ledger WHERE user_id = ? AND operation_id = ? AND entry_type = 'REFUND'`,
    ).get(input.userId, input.operationId);
    if (already) throw new ApiError('already_refunded', 'That operation was already refunded.', 409);
    const stamp = new Date(now).toISOString();
    const balance = postedBalance(db, input.userId) + reservation.amount;
    post(db, input.userId, 'REFUND', reservation.amount, reservation.operationId, input.idempotencyKey, input.reason, balance, stamp);
    restoreAllocation(db, input.userId, reservation.amount);
    audit(db, 'credit_refunded', null, reservation.operationId, { userId: input.userId, amount: reservation.amount }, stamp);
    const body = { balance, status: 'refunded', duplicate: false };
    writeIdempotency(db, input.userId, 'refund', input.idempotencyKey, body, now);
    return body;
  });
}

export function expireCredits(db: Sql, now: number) {
  const policy = currentPolicy(db);
  if (policy.expiryPolicy !== 'expire_after_period') return { expired: 0, policy: policy.expiryPolicy };
  const stamp = new Date(now).toISOString();
  const due = db.prepare(
    `SELECT id, user_id AS userId, remaining FROM allocation_periods WHERE expires_on IS NOT NULL AND expires_on <= ? AND remaining > 0`,
  ).all(stamp) as { id: string; userId: string; remaining: number }[];
  let expired = 0;
  for (const row of due) {
    withTx(db, () => {
      const current = db.prepare(`SELECT remaining FROM allocation_periods WHERE id = ?`).get(row.id) as { remaining: number };
      if (current.remaining <= 0) return;
      const balance = postedBalance(db, row.userId);
      const amount = Math.min(current.remaining, balance);
      if (amount <= 0) {
        db.prepare(`UPDATE allocation_periods SET remaining = 0 WHERE id = ?`).run(row.id);
        return;
      }
      post(db, row.userId, 'EXPIRATION', -amount, row.id, null, 'Configured credit expiry', balance - amount, stamp);
      db.prepare(`UPDATE allocation_periods SET remaining = remaining - ? WHERE id = ?`).run(amount, row.id);
      expired += amount;
    });
  }
  return { expired, policy: policy.expiryPolicy };
}

export function setBillingPolicy(db: Sql, input: { rolloverPolicy?: string; expiryPolicy?: string; paidAllocationEnabled?: boolean }) {
  const current = currentPolicy(db);
  const rollover = input.rolloverPolicy ?? current.rolloverPolicy;
  const expiry = input.expiryPolicy ?? current.expiryPolicy;
  if (!['undecided', 'none', 'expire_after_period'].includes(expiry)) {
    throw new ApiError('invalid_policy', 'That expiry policy was not accepted.', 400);
  }
  if (!['undecided', 'none', 'rollover'].includes(rollover)) {
    throw new ApiError('invalid_policy', 'That rollover policy was not accepted.', 400);
  }
  const paid = input.paidAllocationEnabled === undefined ? current.paidAllocationEnabled : (input.paidAllocationEnabled ? 1 : 0);
  db.prepare(
    `UPDATE billing_policies SET rollover_policy = ?, expiry_policy = ?, paid_allocation_enabled = ? WHERE id = 'current'`,
  ).run(rollover, expiry, paid);
  return { rolloverPolicy: rollover, expiryPolicy: expiry, paidAllocationEnabled: paid === 1 };
}

export function listReservations(db: Sql, status?: string) {
  if (status) {
    return db.prepare(
      `SELECT id, user_id AS userId, operation_id AS operationId, amount, status, provider, operation_type AS operationType, created_at AS createdAt
       FROM credit_reservations WHERE status = ? ORDER BY created_at`,
    ).all(status);
  }
  return db.prepare(
    `SELECT id, user_id AS userId, operation_id AS operationId, amount, status, provider, operation_type AS operationType, created_at AS createdAt
     FROM credit_reservations ORDER BY created_at`,
  ).all();
}

export function listAccountEntitlements(db: Sql) {
  return db.prepare(
    `SELECT e.user_id AS userId, e.plan_code AS planCode, e.status, e.source,
            COALESCE((SELECT SUM(delta) FROM credit_ledger c WHERE c.user_id = e.user_id), 0) AS balance
     FROM subscription_entitlements e WHERE e.status = 'active' ORDER BY e.effective_from`,
  ).all();
}

export function usageTotals(db: Sql) {
  return db.prepare(
    `SELECT provider, operation_type AS operationType, request_status AS requestStatus, cost_status AS costStatus,
            COUNT(*) AS operations, SUM(credits_consumed) AS creditsConsumed,
            SUM(reported_cost_minor) AS reportedCostMinor, SUM(estimated_cost_minor) AS estimatedCostMinor
     FROM provider_costs GROUP BY provider, operation_type, request_status, cost_status`,
  ).all();
}

export function reconcile(db: Sql, userId: string) {
  const balance = postedBalance(db, userId);
  const open = db.prepare(
    `SELECT COALESCE(SUM(amount), 0) AS held FROM credit_reservations WHERE user_id = ? AND status IN ('reserved', 'unknown')`,
  ).get(userId) as { held: number };
  const debits = db.prepare(
    `SELECT COALESCE(SUM(-delta), 0) AS debited FROM credit_ledger WHERE user_id = ? AND entry_type = 'RESERVATION'`,
  ).get(userId) as { debited: number };
  const releases = db.prepare(
    `SELECT COALESCE(SUM(delta), 0) AS released FROM credit_ledger WHERE user_id = ? AND entry_type = 'RELEASE'`,
  ).get(userId) as { released: number };
  return {
    balance,
    openHolds: Number(open.held),
    reservationDebits: Number(debits.debited),
    releases: Number(releases.released),
    nonNegative: balance >= 0,
  };
}

export interface PreparedOperation {
  userId: string;
  featureKey: string;
  credits: unknown;
  operationType: 'text' | 'image';
  provider: 'openai' | 'fashn' | 'mock';
  idempotencyKey: string;
}

export function prepareAuthorizedOperation(db: Sql, input: PreparedOperation, now: number) {
  if (input.provider !== 'mock') {
    throw new ApiError('provider_disabled', 'Live provider calls are not enabled.', 403);
  }
  return reserveCredits(db, {
    userId: input.userId,
    amount: input.credits,
    idempotencyKey: input.idempotencyKey,
    operationType: input.operationType,
    featureKey: input.featureKey,
    provider: input.provider,
    reason: 'Prepared mock operation',
  }, now);
}

interface ReservationRow {
  id: string;
  userId: string;
  operationId: string;
  amount: number;
  status: string;
}

function loadReservation(db: Sql, userId: string, operationId: string): ReservationRow {
  const row = db.prepare(
    `SELECT id, user_id AS userId, operation_id AS operationId, amount, status FROM credit_reservations WHERE user_id = ? AND operation_id = ?`,
  ).get(userId, operationId) as ReservationRow | undefined;
  if (!row) throw new ApiError('not_found', 'That reservation was not found.', 404);
  return row;
}

function assertCanSpend(db: Sql, userId: string, featureKey: string, now: number): void {
  const entitlement = activeEntitlement(db, userId, now);
  if (!entitlement) throw new ApiError('entitlement_inactive', 'This account has no active entitlement.', 403);
  if (featureKey === 'family.dependent') {
    throw new ApiError('dependent_forbidden', 'A dependent profile cannot spend credits.', 403);
  }
  const keys = JSON.parse(entitlement.featureKeysJson) as string[];
  if (!keys.includes(featureKey)) throw new ApiError('feature_unavailable', 'That feature is not included in the current entitlement.', 403);
}

function activeEntitlement(db: Sql, userId: string, now: number) {
  const stamp = new Date(now).toISOString();
  return db.prepare(
    `SELECT plan_code AS planCode, plan_version AS planVersion, status, effective_to AS effectiveTo, feature_keys_json AS featureKeysJson
     FROM subscription_entitlements
     WHERE user_id = ? AND status = 'active' AND effective_from <= ? AND (effective_to IS NULL OR effective_to > ?)`,
  ).get(userId, stamp, stamp) as { planCode: string; planVersion: number; status: string; effectiveTo: string | null; featureKeysJson: string } | undefined;
}

function publishedPlan(db: Sql, planCode: PlanCode) {
  const plan = db.prepare(
    `SELECT version, entitlement_keys_json AS entitlementKeysJson FROM plan_definitions
     WHERE plan_code = ? AND status = 'published' ORDER BY version DESC LIMIT 1`,
  ).get(planCode) as { version: number; entitlementKeysJson: string } | undefined;
  if (!plan) throw new ApiError('unknown_plan', 'That plan is not published.', 400);
  return plan;
}

function postedBalance(db: Sql, userId: string): number {
  const row = db.prepare(`SELECT COALESCE(SUM(delta), 0) AS balance FROM credit_ledger WHERE user_id = ?`).get(userId) as { balance: number };
  return Number(row.balance);
}

function post(db: Sql, userId: string, entryType: (typeof ENTRY_TYPES)[number], delta: number, operationId: string, idempotencyKey: string | null, reason: string, resulting: number, stamp: string): void {
  db.prepare(
    `INSERT INTO credit_ledger (id, user_id, delta, operation_ref, reason, created_at, entry_type, operation_id, idempotency_key, resulting_balance)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(randomUUID(), userId, delta, operationId, reason, stamp, entryType, operationId, idempotencyKey, resulting);
}

function reduceAllocation(db: Sql, userId: string, amount: number): void {
  let left = amount;
  const rows = db.prepare(
    `SELECT id, remaining FROM allocation_periods WHERE user_id = ? AND remaining > 0 ORDER BY created_at`,
  ).all(userId) as { id: string; remaining: number }[];
  for (const row of rows) {
    if (left <= 0) break;
    const used = Math.min(row.remaining, left);
    db.prepare(`UPDATE allocation_periods SET remaining = remaining - ? WHERE id = ?`).run(used, row.id);
    left -= used;
  }
}

function restoreAllocation(db: Sql, userId: string, amount: number): void {
  let left = amount;
  const rows = db.prepare(
    `SELECT id, amount, remaining FROM allocation_periods WHERE user_id = ? ORDER BY created_at DESC`,
  ).all(userId) as { id: string; amount: number; remaining: number }[];
  for (const row of rows) {
    if (left <= 0) break;
    const room = Math.max(0, row.amount - row.remaining);
    if (room <= 0) continue;
    const restored = Math.min(room, left);
    db.prepare(`UPDATE allocation_periods SET remaining = remaining + ? WHERE id = ?`).run(restored, row.id);
    left -= restored;
  }
}

function currentPolicy(db: Sql) {
  return db.prepare(
    `SELECT rollover_policy AS rolloverPolicy, expiry_policy AS expiryPolicy, paid_allocation_enabled AS paidAllocationEnabled FROM billing_policies WHERE id = 'current'`,
  ).get() as { rolloverPolicy: string; expiryPolicy: string; paidAllocationEnabled: number };
}

function readIdempotency(db: Sql, userId: string, scope: string, key: string): Record<string, unknown> | null {
  const row = db.prepare(
    `SELECT response_json AS responseJson FROM credit_idempotency WHERE user_id = ? AND scope = ? AND idempotency_key = ?`,
  ).get(userId, scope, key) as { responseJson: string } | undefined;
  return row ? JSON.parse(row.responseJson) as Record<string, unknown> : null;
}

function writeIdempotency(db: Sql, userId: string, scope: string, key: string, body: unknown, now: number): void {
  db.prepare(
    `INSERT INTO credit_idempotency (user_id, scope, idempotency_key, response_json, created_at) VALUES (?, ?, ?, ?, ?)`,
  ).run(userId, scope, key, JSON.stringify(body), new Date(now).toISOString());
}

function audit(db: Sql, eventType: string, actor: string | null, resourceId: string, metadata: Record<string, unknown>, stamp: string): void {
  db.prepare(
    `INSERT INTO audit_events (id, event_type, actor_user_id, resource_type, resource_id, metadata_json, created_at)
     VALUES (?, ?, ?, 'membership', ?, ?, ?)`,
  ).run(randomUUID(), eventType, actor, resourceId, JSON.stringify(metadata), stamp);
}

function withTx<T>(db: Sql, fn: () => T): T {
  db.exec('BEGIN IMMEDIATE');
  try {
    const value = fn();
    db.exec('COMMIT');
    return value;
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}

function assertUnits(value: unknown): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value <= 0 || value > 1_000_000) {
    throw new ApiError('invalid_credit', 'Credits must be a positive integer.', 400);
  }
  return value;
}

function assertPlan(value: string): PlanCode {
  if (!PLAN_CODES.includes(value as PlanCode)) throw new ApiError('unknown_plan', 'That plan is not published.', 400);
  return value as PlanCode;
}

function assertStatus(value: string): EntitlementStatus {
  if (!STATUSES.includes(value as EntitlementStatus)) throw new ApiError('invalid_status', 'That entitlement status was not accepted.', 400);
  return value as EntitlementStatus;
}

function assertPeriod(value: string): string {
  if (!/^\d{4}-\d{2}$/.test(value)) throw new ApiError('invalid_period', 'The billing period was not accepted.', 400);
  return value;
}

function periodKeyFrom(now: number): string {
  return new Date(now).toISOString().slice(0, 7);
}

function periodEnd(periodKey: string): string {
  const [year, month] = periodKey.split('-').map(Number);
  const next = new Date(Date.UTC(year, month, 1));
  return next.toISOString();
}
