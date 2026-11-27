import { createRequire } from 'node:module';
import { randomUUID } from 'node:crypto';

const require = createRequire(import.meta.url);
const webpush = require('web-push') as typeof import('web-push');
import type { Sql } from '../db.js';
import { ApiError, logEvent } from '../errors.js';
import type { PushConfig } from './pushConfig.js';
import { enqueuePendingPush } from './pending.js';
import {
  isInAppPushEndpoint,
  listPushSubscriptionsForUser,
  markPushFailure,
  markPushSuccess,
  type PushSubscriptionRecord,
} from './subscriptions.js';

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  kind?: string;
  tag?: string;
}

export interface PushSendResult {
  attempted: number;
  delivered: number;
  failed: number;
  removed: number;
}

function configureWebPush(config: PushConfig): void {
  if (!config.publicKey || !config.privateKey) {
    throw new ApiError('push_disabled', 'Browser push is not configured on this server.', 503);
  }
  webpush.setVapidDetails(config.subject, config.publicKey, config.privateKey);
}

function logDelivery(
  db: Sql,
  userId: string,
  subscriptionId: string | null,
  payload: PushPayload,
  delivery: 'sent' | 'failed',
  detail: string | null,
  now: number,
): void {
  db.prepare(
    `INSERT INTO push_delivery_log
     (id, user_id, subscription_id, kind, title, body, delivery, detail, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    randomUUID(),
    userId,
    subscriptionId,
    payload.kind || 'generic',
    payload.title.slice(0, 120),
    payload.body.slice(0, 280),
    delivery,
    detail,
    new Date(now).toISOString(),
  );
}

async function sendToSubscription(
  db: Sql,
  config: PushConfig,
  sub: PushSubscriptionRecord,
  payload: PushPayload,
  now: number,
): Promise<'sent' | 'failed' | 'removed'> {
  if (isInAppPushEndpoint(sub.endpoint)) {
    try {
      enqueuePendingPush(db, sub.userId, payload, now);
      markPushSuccess(db, sub.id, now);
      logDelivery(db, sub.userId, sub.id, payload, 'sent', 'in_app_queued', now);
      return 'sent';
    } catch (error) {
      const detail = error instanceof Error ? error.message.slice(0, 200) : 'in_app_queue_failed';
      markPushFailure(db, sub.id, now, false);
      logDelivery(db, sub.userId, sub.id, payload, 'failed', detail, now);
      return 'failed';
    }
  }

  configureWebPush(config);
  try {
    await webpush.sendNotification(
      {
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh, auth: sub.auth },
      },
      JSON.stringify({
        title: payload.title,
        body: payload.body,
        url: payload.url || '/',
        kind: payload.kind || 'generic',
        tag: payload.tag || payload.kind || 'istyleu',
      }),
      {
        TTL: 60 * 60 * 12,
        urgency: 'normal',
      },
    );
    markPushSuccess(db, sub.id, now);
    logDelivery(db, sub.userId, sub.id, payload, 'sent', null, now);
    return 'sent';
  } catch (error) {
    const statusCode = typeof error === 'object' && error && 'statusCode' in error
      ? Number((error as { statusCode?: number }).statusCode)
      : 0;
    const gone = statusCode === 404 || statusCode === 410;
    markPushFailure(db, sub.id, now, gone);
    const detail = error instanceof Error ? error.message.slice(0, 200) : 'push_failed';
    logDelivery(db, sub.userId, gone ? null : sub.id, payload, 'failed', detail, now);
    logEvent('push_send_failed', { userId: sub.userId, statusCode, gone }, 'warn');
    return gone ? 'removed' : 'failed';
  }
}

export async function sendPushToUser(opts: {
  db: Sql;
  config: PushConfig;
  userId: string;
  payload: PushPayload;
  now: number;
}): Promise<PushSendResult> {
  if (!opts.config.enabled) {
    throw new ApiError('push_disabled', 'Browser push is not configured on this server.', 503);
  }
  const subs = listPushSubscriptionsForUser(opts.db, opts.userId);
  if (!subs.length) {
    throw new ApiError('push_not_subscribed', 'This browser is not subscribed to push alerts yet. Turn on Push Alerts and allow notifications.', 400);
  }
  let delivered = 0;
  let failed = 0;
  let removed = 0;
  for (const sub of subs) {
    const result = await sendToSubscription(opts.db, opts.config, sub, opts.payload, opts.now);
    if (result === 'sent') delivered += 1;
    else if (result === 'removed') removed += 1;
    else failed += 1;
  }
  return { attempted: subs.length, delivered, failed, removed };
}

export function countPushDeliveriesToday(db: Sql, userId: string, now: number): number {
  const date = new Date(now);
  date.setUTCHours(0, 0, 0, 0);
  const since = date.toISOString();
  const row = db.prepare(
    `SELECT COUNT(*) AS count FROM push_delivery_log
     WHERE user_id = ? AND created_at >= ? AND delivery = 'sent'`,
  ).get(userId, since) as { count: number } | undefined;
  return Number(row?.count ?? 0);
}
