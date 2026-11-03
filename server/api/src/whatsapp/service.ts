import { randomInt, randomUUID } from 'node:crypto';
import { ApiError, logEvent } from '../errors.js';
import type { Sql } from '../db.js';
import { getProfile } from '../domain/profiles.js';
import { canSendProactiveNotificationToday } from '../domain/notificationFrequency.js';
import { resolvePersonaFromProfile } from '../ai/context.js';
import { createConversation, sendMessage, type StylistRuntime } from '../ai/service.js';
import { loadWhatsAppConfig, type WhatsAppConfig } from './whatsappConfig.js';
import {
  normalizeWhatsAppPhone,
  sendWhatsAppTemplate,
  sendWhatsAppText,
  validateTwilioSignature,
} from './twilio.js';

const LINK_TTL_MS = 15 * 60 * 1000;

function stamp(now: number): string {
  return new Date(now).toISOString();
}

function generateCode(): string {
  return String(randomInt(100000, 999999));
}

function maskPhone(e164: string | null): string | null {
  if (!e164 || e164.length < 7) return e164;
  return `${e164.slice(0, 4)}…${e164.slice(-3)}`;
}

export function whatsappStatus(config: WhatsAppConfig = loadWhatsAppConfig()): Record<string, unknown> {
  return {
    enabled: config.enabled,
    fromNumberConfigured: Boolean(config.fromNumber),
    fromNumber: config.fromNumber,
    fromNumberMasked: maskPhone(config.fromNumber),
    proactiveTemplatesConfigured: Boolean(config.styleAlertContentSid),
    linkInstructions: config.enabled
      ? 'Open My Profile → Connect WhatsApp, then send LINK followed by your 6-digit code to this number. After linking, your personal stylist can message you first (for example about a new piece you will like).'
      : 'WhatsApp is not configured on this server yet. Register your own number as a Twilio WhatsApp sender, then set TWILIO_* env vars.',
  };
}

export function getWhatsAppLinkForUser(db: Sql, userId: string): Record<string, unknown> {
  const row = db.prepare(
    `SELECT phone_e164 AS phoneE164, linked_at AS linkedAt, conversation_id AS conversationId,
            last_inbound_at AS lastInboundAt, last_outbound_at AS lastOutboundAt,
            proactive_opt_in AS proactiveOptIn
     FROM whatsapp_links WHERE user_id = ?`,
  ).get(userId) as {
    phoneE164: string;
    linkedAt: string;
    conversationId: string | null;
    lastInboundAt: string | null;
    lastOutboundAt: string | null;
    proactiveOptIn: number;
  } | undefined;
  return {
    linked: Boolean(row),
    phoneE164: row?.phoneE164 ?? null,
    linkedAt: row?.linkedAt ?? null,
    lastInboundAt: row?.lastInboundAt ?? null,
    lastOutboundAt: row?.lastOutboundAt ?? null,
    proactiveOptIn: row ? row.proactiveOptIn !== 0 : false,
  };
}

export function createWhatsAppLinkCode(db: Sql, userId: string, now: number): Record<string, unknown> {
  db.prepare('DELETE FROM whatsapp_link_codes WHERE user_id = ? AND consumed_at IS NULL').run(userId);
  const code = generateCode();
  const created = stamp(now);
  const expires = stamp(now + LINK_TTL_MS);
  db.prepare(
    'INSERT INTO whatsapp_link_codes (code, user_id, expires_at, created_at, consumed_at) VALUES (?, ?, ?, ?, NULL)',
  ).run(code, userId, expires, created);
  const config = loadWhatsAppConfig();
  return {
    code,
    expiresAt: expires,
    fromNumber: config.fromNumber,
    messageHint: config.fromNumber
      ? `Send this exact message to ${config.fromNumber} on WhatsApp: LINK ${code}`
      : `Send this exact message to your MyStyle WhatsApp number: LINK ${code}`,
  };
}

export function unlinkWhatsApp(db: Sql, userId: string): void {
  db.prepare('DELETE FROM whatsapp_links WHERE user_id = ?').run(userId);
  db.prepare('DELETE FROM whatsapp_link_codes WHERE user_id = ? AND consumed_at IS NULL').run(userId);
}

function tryConsumeLinkCode(db: Sql, phoneE164: string, code: string, now: number): { ok: true; userId: string } | { ok: false; reason: string } {
  const row = db.prepare(
    'SELECT code, user_id AS userId, expires_at AS expiresAt, consumed_at AS consumedAt FROM whatsapp_link_codes WHERE code = ?',
  ).get(code) as { code: string; userId: string; expiresAt: string; consumedAt: string | null } | undefined;
  if (!row) return { ok: false, reason: 'That link code was not found. Generate a new one in My Profile.' };
  if (row.consumedAt) return { ok: false, reason: 'That link code was already used. Generate a new one in My Profile.' };
  if (Date.parse(row.expiresAt) < now) return { ok: false, reason: 'That link code expired. Generate a new one in My Profile.' };

  const existingPhone = db.prepare('SELECT user_id AS userId FROM whatsapp_links WHERE phone_e164 = ?').get(phoneE164) as { userId: string } | undefined;
  if (existingPhone && existingPhone.userId !== row.userId) {
    return { ok: false, reason: 'This WhatsApp number is already linked to another MyStyle account.' };
  }

  const created = stamp(now);
  db.prepare('UPDATE whatsapp_link_codes SET consumed_at = ? WHERE code = ?').run(created, code);
  db.prepare('DELETE FROM whatsapp_links WHERE user_id = ?').run(row.userId);
  db.prepare(
    `INSERT INTO whatsapp_links (
       phone_e164, user_id, conversation_id, linked_at, updated_at,
       last_inbound_at, last_outbound_at, proactive_opt_in
     ) VALUES (?, ?, NULL, ?, ?, ?, NULL, 1)
     ON CONFLICT(phone_e164) DO UPDATE SET
       user_id=excluded.user_id,
       conversation_id=NULL,
       linked_at=excluded.linked_at,
       updated_at=excluded.updated_at,
       last_inbound_at=excluded.last_inbound_at,
       proactive_opt_in=1`,
  ).run(phoneE164, row.userId, created, created, created);
  return { ok: true, userId: row.userId };
}

function touchInbound(db: Sql, phoneE164: string, now: number): void {
  db.prepare(
    'UPDATE whatsapp_links SET last_inbound_at = ?, updated_at = ? WHERE phone_e164 = ?',
  ).run(stamp(now), stamp(now), phoneE164);
}

function setProactiveOptIn(db: Sql, phoneE164: string, optedIn: boolean, now: number): void {
  db.prepare(
    'UPDATE whatsapp_links SET proactive_opt_in = ?, updated_at = ? WHERE phone_e164 = ?',
  ).run(optedIn ? 1 : 0, stamp(now), phoneE164);
}

function stylistGreeting(db: Sql, userId: string): string {
  try {
    const profile = getProfile(db, userId);
    const persona = resolvePersonaFromProfile(profile);
    const firstName = typeof profile.displayName === 'string' && profile.displayName.trim()
      ? profile.displayName.trim()
      : 'there';
    return `Hi ${firstName} — I'm ${persona.name}, your MyStyle personal stylist on WhatsApp.\n\nAsk me about an occasion, a colour, or a look. I can also message you first when I spot a piece you'll love.\n\nReply STOP anytime to pause those tips.`;
  } catch {
    return 'Your WhatsApp is linked to MyStyle. Ask me anything about an outfit or occasion. Reply STOP to pause proactive tips.';
  }
}

function formatWhatsAppReply(text: string, stylistName: string): string {
  const cleaned = text.replace(/\*\*/g, '*').trim();
  const body = cleaned.length > 1400 ? `${cleaned.slice(0, 1390)}…` : cleaned;
  if (body.toLowerCase().startsWith(stylistName.toLowerCase())) return body;
  return `*${stylistName}*\n${body}`;
}

function personaFor(db: Sql, userId: string): { name: string } {
  try {
    return resolvePersonaFromProfile(getProfile(db, userId));
  } catch {
    return { name: 'Aria' };
  }
}

function inSessionWindow(lastInboundAt: string | null | undefined, now: number, windowMs: number): boolean {
  if (!lastInboundAt) return false;
  const at = Date.parse(lastInboundAt);
  if (!Number.isFinite(at)) return false;
  return now - at <= windowMs;
}

function logOutbound(
  db: Sql,
  input: {
    userId: string;
    phoneE164: string;
    kind: string;
    delivery: string;
    bodyPreview: string;
    twilioSid: string | null;
    now: number;
  },
): void {
  db.prepare(
    `INSERT INTO whatsapp_outbound_log (id, user_id, phone_e164, kind, delivery, body_preview, twilio_sid, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    randomUUID(),
    input.userId,
    input.phoneE164,
    input.kind,
    input.delivery,
    input.bodyPreview.slice(0, 280),
    input.twilioSid,
    stamp(input.now),
  );
  db.prepare(
    'UPDATE whatsapp_links SET last_outbound_at = ?, updated_at = ? WHERE phone_e164 = ?',
  ).run(stamp(input.now), stamp(input.now), input.phoneE164);
}

async function replyAsStylist(
  runtime: StylistRuntime,
  db: Sql,
  userId: string,
  phoneE164: string,
  text: string,
  config: WhatsAppConfig,
  fetchImpl: typeof fetch,
): Promise<void> {
  const link = db.prepare(
    'SELECT conversation_id AS conversationId FROM whatsapp_links WHERE phone_e164 = ? AND user_id = ?',
  ).get(phoneE164, userId) as { conversationId: string | null } | undefined;

  let conversationId = link?.conversationId ?? null;
  if (!conversationId) {
    const created = createConversation(db, userId, runtime.now());
    conversationId = String(created.id);
    db.prepare('UPDATE whatsapp_links SET conversation_id = ?, updated_at = ? WHERE phone_e164 = ?').run(
      conversationId,
      stamp(runtime.now()),
      phoneE164,
    );
  }

  const persona = personaFor(db, userId);
  const idempotencyKey = `wa-${phoneE164.replace(/\D/g, '').slice(-10)}-${Date.now().toString(36)}`;
  const message = await sendMessage(runtime, userId, conversationId, text, idempotencyKey);
  const content = typeof message.content === 'string' ? message.content : 'I could not style that just now. Try another occasion or question.';
  const body = formatWhatsAppReply(content, persona.name);
  const sent = await sendWhatsAppText(config, phoneE164, body, fetchImpl);
  logOutbound(db, {
    userId,
    phoneE164,
    kind: 'stylist_reply',
    delivery: sent.ok ? 'session_text' : 'failed',
    bodyPreview: body,
    twilioSid: sent.sid,
    now: runtime.now(),
  });
}

export type NewPieceAlert = {
  pieceName: string;
  reason?: string;
  colour?: string;
  category?: string;
  retailerHint?: string;
};

/**
 * Stylist-initiated WhatsApp: e.g. "there's a new piece you'll like".
 * Uses free-form text inside the 24h window; otherwise an approved Content template.
 */
export async function notifyNewPieceYoullLike(input: {
  db: Sql;
  userId: string;
  piece: NewPieceAlert;
  now: number;
  config?: WhatsAppConfig;
  fetchImpl?: typeof fetch;
}): Promise<Record<string, unknown>> {
  const config = input.config ?? loadWhatsAppConfig();
  const fetchImpl = input.fetchImpl ?? fetch;
  if (!config.enabled) {
    throw new ApiError('whatsapp_disabled', 'WhatsApp is not enabled on this server.', 503);
  }

  const link = input.db.prepare(
    `SELECT phone_e164 AS phoneE164, last_inbound_at AS lastInboundAt, proactive_opt_in AS proactiveOptIn
     FROM whatsapp_links WHERE user_id = ?`,
  ).get(input.userId) as { phoneE164: string; lastInboundAt: string | null; proactiveOptIn: number } | undefined;

  if (!link) {
    throw new ApiError('whatsapp_not_linked', 'This account has not connected WhatsApp yet.', 409);
  }
  if (!link.proactiveOptIn) {
    throw new ApiError('whatsapp_opted_out', 'This customer paused proactive stylist tips (reply START on WhatsApp to resume).', 409);
  }

  const cadence = canSendProactiveNotificationToday(input.db, input.userId, input.now);
  if (!cadence.allowed) {
    throw new ApiError(
      'notification_daily_limit',
      cadence.hearMoreFromMe
        ? `This customer already received ${cadence.sentToday} stylist tips today (limit ${cadence.limit}).`
        : 'This customer receives one stylist tip per day. They can turn on “hear more from me” in Settings for more.',
      429,
    );
  }

  const persona = personaFor(input.db, input.userId);
  const pieceName = input.piece.pieceName.trim().slice(0, 120);
  if (!pieceName) throw new ApiError('invalid_body', 'pieceName is required.', 400);
  const reason = (input.piece.reason?.trim()
    || 'It matches your colours, silhouette, and how you like to dress.')
    .slice(0, 280);
  const colourBit = input.piece.colour?.trim() ? ` (${input.piece.colour.trim()})` : '';
  const categoryBit = input.piece.category?.trim() ? ` · ${input.piece.category.trim()}` : '';

  const freeForm = formatWhatsAppReply(
    `I spotted something I think you'll love: *${pieceName}*${colourBit}${categoryBit}.\n\n${reason}\n\nReply if you want me to style it into a full look — or say SKIP if it's not for you.`,
    persona.name,
  );

  const sessionOpen = inSessionWindow(link.lastInboundAt, input.now, config.sessionWindowMs);
  let delivery: string;
  let sent: { sid: string | null; ok: boolean; status: number; error: string | null };

  if (sessionOpen) {
    delivery = 'session_text';
    sent = await sendWhatsAppText(config, link.phoneE164, freeForm, fetchImpl);
  } else if (config.styleAlertContentSid) {
    delivery = 'template';
    // Template placeholders (create in Twilio Content Template Builder), e.g.:
    // "Hi! It's {{1}}, your MyStyle stylist. I found something you'll love: {{2}}. {{3}} Reply to chat."
    sent = await sendWhatsAppTemplate(
      config,
      link.phoneE164,
      config.styleAlertContentSid,
      {
        '1': persona.name,
        '2': pieceName,
        '3': reason.slice(0, 200),
      },
      fetchImpl,
    );
  } else {
    throw new ApiError(
      'whatsapp_template_required',
      'Outside the 24-hour WhatsApp window. Approve a Content template and set TWILIO_WHATSAPP_CONTENT_SID_STYLE_ALERT, or wait until the customer messages first.',
      409,
    );
  }

  logOutbound(input.db, {
    userId: input.userId,
    phoneE164: link.phoneE164,
    kind: 'new_piece',
    delivery: sent.ok ? delivery : 'failed',
    bodyPreview: freeForm,
    twilioSid: sent.sid,
    now: input.now,
  });

  if (!sent.ok) {
    logEvent('whatsapp_outbound_failed', { kind: 'new_piece', status: sent.status, error: sent.error });
    throw new ApiError('whatsapp_send_failed', 'Twilio could not deliver that WhatsApp alert.', 502);
  }

  logEvent('whatsapp_outbound', { kind: 'new_piece', delivery, userId: input.userId });
  return {
    ok: true,
    kind: 'new_piece',
    delivery,
    phoneE164Masked: maskPhone(link.phoneE164),
    stylistName: persona.name,
    pieceName,
    twilioSid: sent.sid,
  };
}

export async function handleTwilioWhatsAppWebhook(input: {
  db: Sql;
  stylist: StylistRuntime;
  config: WhatsAppConfig;
  now: number;
  signature: string | undefined;
  webhookUrl: string;
  params: Record<string, string>;
  fetchImpl?: typeof fetch;
}): Promise<{ twiml: string }> {
  const { db, stylist, config, now, signature, webhookUrl, params } = input;
  const fetchImpl = input.fetchImpl ?? fetch;

  if (!config.enabled || !config.authToken) {
    logEvent('whatsapp_disabled', {});
    return { twiml: '<Response></Response>' };
  }

  if (!validateTwilioSignature(config.authToken, signature, webhookUrl, params)) {
    throw new ApiError('forbidden', 'Invalid Twilio signature.', 403);
  }

  const from = normalizeWhatsAppPhone(params.From || '');
  const body = (params.Body || '').trim();
  if (!from) {
    return { twiml: '<Response></Response>' };
  }

  const empty = { twiml: '<Response></Response>' };

  const linkMatch = body.match(/^link\s+(\d{6})$/i);
  if (linkMatch) {
    const result = tryConsumeLinkCode(db, from, linkMatch[1]!, now);
    if (!result.ok) {
      await sendWhatsAppText(config, from, result.reason, fetchImpl);
      return empty;
    }
    await sendWhatsAppText(config, from, stylistGreeting(db, result.userId), fetchImpl);
    logEvent('whatsapp_linked', { userId: result.userId });
    return empty;
  }

  const link = db.prepare(
    'SELECT user_id AS userId FROM whatsapp_links WHERE phone_e164 = ?',
  ).get(from) as { userId: string } | undefined;

  if (!link) {
    await sendWhatsAppText(
      config,
      from,
      `Welcome to MyStyle AI WhatsApp.\n\nEach customer gets *their own* personal stylist (name, voice, and taste).\n\n1. Sign in on the MyStyle app\n2. Open Profile → Connect WhatsApp\n3. Send: LINK ######\n\nThis line: ${config.fromNumber ?? ''}`.trim(),
      fetchImpl,
    );
    return empty;
  }

  touchInbound(db, from, now);

  if (/^(stop|unsubscribe|opt.?out|pause)$/i.test(body)) {
    setProactiveOptIn(db, from, false, now);
    await sendWhatsAppText(
      config,
      from,
      'Got it — I will pause proactive styling tips. You can still message me anytime. Reply START to resume tips.',
      fetchImpl,
    );
    return empty;
  }

  if (/^(start|resume|opt.?in|unpause)$/i.test(body)) {
    setProactiveOptIn(db, from, true, now);
    await sendWhatsAppText(
      config,
      from,
      'Welcome back — proactive tips are on. I will message you when I spot a piece you will like.',
      fetchImpl,
    );
    return empty;
  }

  if (!body) {
    await sendWhatsAppText(config, from, 'Send a styling question — for example: "What should I wear to a Cape Town brunch?"', fetchImpl);
    return empty;
  }

  if (/^(hi|hello|hey|help)$/i.test(body)) {
    await sendWhatsAppText(config, from, stylistGreeting(db, link.userId), fetchImpl);
    return empty;
  }

  void replyAsStylist(stylist, db, link.userId, from, body, config, fetchImpl).catch(async (error) => {
    logEvent('whatsapp_stylist_error', {
      message: error instanceof Error ? error.message : 'unknown',
    });
    try {
      await sendWhatsAppText(
        config,
        from,
        'I could not finish that styling reply just now. Please try again in a moment.',
        fetchImpl,
      );
    } catch {
      /* ignore */
    }
  });
  return empty;
}
