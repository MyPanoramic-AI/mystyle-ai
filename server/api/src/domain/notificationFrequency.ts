import type { Sql } from '../db.js';
import { getPreferences } from './profiles.js';

/** Default cadence: one stylist tip per day. Hear-more unlocks a higher daily cap. */
export const DAILY_NOTIFICATION_LIMIT = 1;
export const HEAR_MORE_DAILY_NOTIFICATION_LIMIT = 5;

export function hearMoreFromMeEnabled(notifications: unknown): boolean {
  if (!notifications || typeof notifications !== 'object' || Array.isArray(notifications)) return false;
  return (notifications as Record<string, unknown>).hearMoreFromMe === true;
}

export function dailyNotificationLimit(notifications: unknown): number {
  return hearMoreFromMeEnabled(notifications) ? HEAR_MORE_DAILY_NOTIFICATION_LIMIT : DAILY_NOTIFICATION_LIMIT;
}

function startOfUtcDayIso(now: number): string {
  const date = new Date(now);
  date.setUTCHours(0, 0, 0, 0);
  return date.toISOString();
}

export function countProactiveNotificationsToday(db: Sql, userId: string, now: number): number {
  const since = startOfUtcDayIso(now);
  const row = db.prepare(
    `SELECT COUNT(*) AS count FROM whatsapp_outbound_log
     WHERE user_id = ? AND created_at >= ? AND delivery != 'failed'`,
  ).get(userId, since) as { count: number } | undefined;
  return Number(row?.count ?? 0);
}

/**
 * Throws-friendly check for proactive outreach.
 * Returns whether another tip may be sent today under the customer's preference.
 */
export function canSendProactiveNotificationToday(db: Sql, userId: string, now: number): {
  allowed: boolean;
  hearMoreFromMe: boolean;
  limit: number;
  sentToday: number;
} {
  let notifications: unknown = { hearMoreFromMe: false };
  try {
    notifications = getPreferences(db, userId).notifications;
  } catch {
    notifications = { hearMoreFromMe: false };
  }
  const hearMoreFromMe = hearMoreFromMeEnabled(notifications);
  const limit = dailyNotificationLimit(notifications);
  const sentToday = countProactiveNotificationsToday(db, userId, now);
  return {
    allowed: sentToday < limit,
    hearMoreFromMe,
    limit,
    sentToday,
  };
}
