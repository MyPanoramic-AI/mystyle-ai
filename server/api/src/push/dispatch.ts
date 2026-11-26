import type { Sql } from '../db.js';
import { getPreferences, getProfile } from '../domain/profiles.js';
import {
  canSendProactiveNotificationToday,
  hearMoreFromMeEnabled,
} from '../domain/notificationFrequency.js';
import type { PushConfig } from './pushConfig.js';
import { listAllPushSubscriptions } from './subscriptions.js';
import { countPushDeliveriesToday, sendPushToUser, type PushPayload } from './sender.js';

const STYLE_TIPS: Array<{ title: string; body: string; url: string; kind: string }> = [
  {
    title: 'Morning style check-in',
    body: 'Open IStyleU for a quick outfit idea that matches today’s weather and your wardrobe.',
    url: '/?tab=stylist',
    kind: 'weather_outfit',
  },
  {
    title: 'A look from your stylist',
    body: 'Three fresh outfit options are ready when you are — tap to chat with your stylist.',
    url: '/?tab=stylist',
    kind: 'style_tip',
  },
  {
    title: 'Wardrobe rotation nudge',
    body: 'Rotate one piece you have not worn lately. Your stylist can help you restyle it.',
    url: '/?tab=wardrobe',
    kind: 'wardrobe_rotation',
  },
  {
    title: 'Friday style drop',
    body: 'Weekend plans? Ask your stylist for three looks that fit your Aesthetic DNA.',
    url: '/?tab=stylist',
    kind: 'weekly_style_drop',
  },
  {
    title: 'Finish the look',
    body: 'Shoes, bag, or jewellery can complete today’s outfit — browse Shop the Look gaps.',
    url: '/?tab=shop',
    kind: 'style_tip',
  },
];

function tipForNow(now: number): PushPayload {
  const tip = STYLE_TIPS[Math.floor(now / 86_400_000) % STYLE_TIPS.length]!;
  return {
    title: tip.title,
    body: tip.body,
    url: tip.url,
    kind: tip.kind,
    tag: `istyleu-${tip.kind}`,
  };
}

function notificationsObject(raw: unknown): Record<string, unknown> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  return raw as Record<string, unknown>;
}

function pushEnabled(notifications: Record<string, unknown>): boolean {
  return notifications.pushEnabled !== false;
}

function contentAllows(notifications: Record<string, unknown>, kind: string): boolean {
  if (kind === 'weather_outfit') return notifications.weatherOutfitAlerts !== false;
  if (kind === 'weekly_style_drop') return notifications.weeklyStyleDrop !== false;
  if (kind === 'wardrobe_rotation') return notifications.wardrobeRotationPrompts !== false;
  return true;
}

function firstNameFor(db: Sql, userId: string): string {
  try {
    const profile = getProfile(db, userId) as Record<string, unknown>;
    const personal = profile.personal && typeof profile.personal === 'object'
      ? profile.personal as Record<string, unknown>
      : null;
    const name = typeof personal?.firstName === 'string' ? personal.firstName.trim() : '';
    return name || 'there';
  } catch {
    return 'there';
  }
}

/**
 * Sends a one-off test push to the signed-in user (bypasses daily cadence).
 */
export async function sendTestPushToUser(opts: {
  db: Sql;
  config: PushConfig;
  userId: string;
  now: number;
}): Promise<{ ok: boolean; delivered: number; attempted: number }> {
  const name = firstNameFor(opts.db, opts.userId);
  const result = await sendPushToUser({
    db: opts.db,
    config: opts.config,
    userId: opts.userId,
    now: opts.now,
    payload: {
      title: 'IStyleU push is working',
      body: `Hi ${name} — this is a test alert from your notification preferences.`,
      url: '/?tab=profile&sub=notifications',
      kind: 'test',
      tag: 'istyleu-test',
    },
  });
  return { ok: result.delivered > 0, delivered: result.delivered, attempted: result.attempted };
}

/**
 * Daily / cadence dispatcher for subscribed users with push enabled.
 */
export async function dispatchScheduledPushTips(opts: {
  db: Sql;
  config: PushConfig;
  now: number;
}): Promise<{ usersConsidered: number; sent: number; skipped: number; failed: number }> {
  const tip = tipForNow(opts.now);
  const subs = listAllPushSubscriptions(opts.db);
  const byUser = new Map<string, true>();
  for (const sub of subs) byUser.set(sub.userId, true);

  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const userId of byUser.keys()) {
    let notifications = notificationsObject({});
    try {
      notifications = notificationsObject(getPreferences(opts.db, userId).notifications);
    } catch {
      skipped += 1;
      continue;
    }
    if (!pushEnabled(notifications) || !contentAllows(notifications, tip.kind || 'style_tip')) {
      skipped += 1;
      continue;
    }

    // Combine WhatsApp + push counts so "one a day" stays honest across channels.
    const cadence = canSendProactiveNotificationToday(opts.db, userId, opts.now);
    const pushSentToday = countPushDeliveriesToday(opts.db, userId, opts.now);
    const combined = cadence.sentToday + pushSentToday;
    const limit = hearMoreFromMeEnabled(notifications) ? cadence.limit : cadence.limit;
    if (combined >= limit) {
      skipped += 1;
      continue;
    }

    const name = firstNameFor(opts.db, userId);
    try {
      const result = await sendPushToUser({
        db: opts.db,
        config: opts.config,
        userId,
        now: opts.now,
        payload: {
          ...tip,
          body: `${name}, ${tip.body.charAt(0).toLowerCase()}${tip.body.slice(1)}`,
        },
      });
      if (result.delivered > 0) sent += 1;
      else failed += 1;
    } catch {
      failed += 1;
    }
  }

  return {
    usersConsidered: byUser.size,
    sent,
    skipped,
    failed,
  };
}
