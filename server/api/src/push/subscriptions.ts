import { randomUUID } from 'node:crypto';
import type { Sql } from '../db.js';
import { ApiError } from '../errors.js';

export interface PushSubscriptionRecord {
  id: string;
  userId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  userAgent: string | null;
  createdAt: string;
  updatedAt: string;
  lastSuccessAt: string | null;
  failureCount: number;
}

export interface PushSubscriptionInput {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

function requireKeys(body: unknown): PushSubscriptionInput {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new ApiError('bad_request', 'A push subscription body is required.', 400);
  }
  const row = body as Record<string, unknown>;
  const endpoint = typeof row.endpoint === 'string' ? row.endpoint.trim() : '';
  const keys = row.keys && typeof row.keys === 'object' && !Array.isArray(row.keys)
    ? row.keys as Record<string, unknown>
    : null;
  const p256dh = typeof keys?.p256dh === 'string' ? keys.p256dh.trim() : '';
  const auth = typeof keys?.auth === 'string' ? keys.auth.trim() : '';
  if (!endpoint.startsWith('https://') || !p256dh || !auth) {
    throw new ApiError('bad_request', 'That push subscription is incomplete.', 400);
  }
  return { endpoint, keys: { p256dh, auth } };
}

export function upsertPushSubscription(
  db: Sql,
  userId: string,
  body: unknown,
  now: number,
  userAgent?: string | null,
): PushSubscriptionRecord {
  const input = requireKeys(body);
  const iso = new Date(now).toISOString();
  const existing = db.prepare(
    `SELECT id FROM push_subscriptions WHERE endpoint = ?`,
  ).get(input.endpoint) as { id: string } | undefined;
  const id = existing?.id ?? randomUUID();
  if (existing) {
    db.prepare(
      `UPDATE push_subscriptions
       SET user_id=?, p256dh=?, auth=?, user_agent=?, updated_at=?, failure_count=0
       WHERE id=?`,
    ).run(userId, input.keys.p256dh, input.keys.auth, userAgent ?? null, iso, id);
  } else {
    db.prepare(
      `INSERT INTO push_subscriptions
       (id, user_id, endpoint, p256dh, auth, user_agent, created_at, updated_at, failure_count)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)`,
    ).run(id, userId, input.endpoint, input.keys.p256dh, input.keys.auth, userAgent ?? null, iso, iso);
  }
  return getPushSubscription(db, id)!;
}

export function getPushSubscription(db: Sql, id: string): PushSubscriptionRecord | null {
  const row = db.prepare(`SELECT * FROM push_subscriptions WHERE id = ?`).get(id) as Record<string, unknown> | undefined;
  if (!row) return null;
  return mapRow(row);
}

export function listPushSubscriptionsForUser(db: Sql, userId: string): PushSubscriptionRecord[] {
  const rows = db.prepare(
    `SELECT * FROM push_subscriptions WHERE user_id = ? ORDER BY updated_at DESC`,
  ).all(userId) as Record<string, unknown>[];
  return rows.map(mapRow);
}

export function listAllPushSubscriptions(db: Sql): PushSubscriptionRecord[] {
  const rows = db.prepare(
    `SELECT * FROM push_subscriptions ORDER BY updated_at DESC`,
  ).all() as Record<string, unknown>[];
  return rows.map(mapRow);
}

export function deletePushSubscriptionForUser(db: Sql, userId: string, endpoint: string): { deleted: boolean } {
  const result = db.prepare(
    `DELETE FROM push_subscriptions WHERE user_id = ? AND endpoint = ?`,
  ).run(userId, endpoint);
  return { deleted: Number(result.changes) > 0 };
}

export function deletePushSubscriptionById(db: Sql, id: string): void {
  db.prepare(`DELETE FROM push_subscriptions WHERE id = ?`).run(id);
}

export function markPushSuccess(db: Sql, id: string, now: number): void {
  db.prepare(
    `UPDATE push_subscriptions SET last_success_at=?, failure_count=0, updated_at=? WHERE id=?`,
  ).run(new Date(now).toISOString(), new Date(now).toISOString(), id);
}

export function markPushFailure(db: Sql, id: string, now: number, gone: boolean): void {
  if (gone) {
    deletePushSubscriptionById(db, id);
    return;
  }
  db.prepare(
    `UPDATE push_subscriptions SET failure_count = failure_count + 1, updated_at=? WHERE id=?`,
  ).run(new Date(now).toISOString(), id);
}

function mapRow(row: Record<string, unknown>): PushSubscriptionRecord {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    endpoint: String(row.endpoint),
    p256dh: String(row.p256dh),
    auth: String(row.auth),
    userAgent: row.user_agent == null ? null : String(row.user_agent),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    lastSuccessAt: row.last_success_at == null ? null : String(row.last_success_at),
    failureCount: Number(row.failure_count ?? 0),
  };
}
