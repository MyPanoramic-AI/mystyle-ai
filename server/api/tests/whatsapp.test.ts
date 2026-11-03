import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import test from 'node:test';
import { loadConfig } from '../src/config.js';
import { migrate, openDatabase } from '../src/db.js';
import { createApp } from '../src/http/app.js';
import { RateLimiter } from '../src/auth/rateLimit.js';
import { normalizeWhatsAppPhone, validateTwilioSignature } from '../src/whatsapp/twilio.js';
import { loadWhatsAppConfig, toE164Phone } from '../src/whatsapp/whatsappConfig.js';
import { notifyNewPieceYoullLike } from '../src/whatsapp/service.js';

test('normalises WhatsApp and SA national phones to E.164', () => {
  assert.equal(normalizeWhatsAppPhone('whatsapp:+27821234567'), '+27821234567');
  assert.equal(normalizeWhatsAppPhone('+27821234567'), '+27821234567');
  assert.equal(toE164Phone('0799927273'), '+27799927273');
  assert.equal(toE164Phone('whatsapp:0799927273'), '+27799927273');
  assert.equal(normalizeWhatsAppPhone('whatsapp:abc'), null);
});

test('validates Twilio request signatures', () => {
  const token = 'test-auth-token';
  const url = 'https://example.com/api/whatsapp/webhook';
  const params = { Body: 'LINK 123456', From: 'whatsapp:+27821234567' };
  const data = Object.keys(params).sort().reduce((acc, key) => `${acc}${key}${params[key as keyof typeof params]}`, url);
  const signature = createHmac('sha1', token).update(Buffer.from(data, 'utf8')).digest('base64');
  assert.equal(validateTwilioSignature(token, signature, url, params), true);
  assert.equal(validateTwilioSignature(token, 'bad', url, params), false);
});

test('WhatsApp stays disabled without Twilio credentials', () => {
  const config = loadWhatsAppConfig({ WHATSAPP_ENABLED: 'true' } as NodeJS.ProcessEnv);
  assert.equal(config.enabled, false);
});

test('loadWhatsAppConfig accepts SA national From number', () => {
  const config = loadWhatsAppConfig({
    WHATSAPP_ENABLED: 'true',
    TWILIO_ACCOUNT_SID: 'ACxxx',
    TWILIO_AUTH_TOKEN: 'token',
    TWILIO_WHATSAPP_FROM: '0799927273',
  } as NodeJS.ProcessEnv);
  assert.equal(config.enabled, true);
  assert.equal(config.fromNumber, '+27799927273');
});

test('link code can be issued and consumed through the webhook', async () => {
  const db = openDatabase(':memory:');
  migrate(db, loadConfig().migrationsDir);
  const now = Date.now();
  const stamp = new Date(now).toISOString();
  db.prepare(
    `INSERT INTO users (id, email, password_hash, status, created_at, updated_at, email_verified_at)
     VALUES ('user-wa', 'wa@example.com', 'x', 'active', ?, ?, ?)`,
  ).run(stamp, stamp, stamp);
  db.prepare(
    `INSERT INTO customer_profiles (
       user_id, display_name, completion_status, stylist_name, stylist_gender, stylist_age_vibe, stylist_voice, updated_at
     ) VALUES ('user-wa', 'Nandi', 'complete', 'Lerato', 'woman', 'thirties', 'warm-encouraging', ?)`,
  ).run(stamp);

  const authToken = 'whatsapp-test-token';
  const accountSid = 'ACtest';
  const fromNumber = '+27799927273';
  const webhookUrl = 'https://example.com/api/whatsapp/webhook';
  process.env.WHATSAPP_ENABLED = 'true';
  process.env.TWILIO_ACCOUNT_SID = accountSid;
  process.env.TWILIO_AUTH_TOKEN = authToken;
  process.env.TWILIO_WHATSAPP_FROM = fromNumber;
  process.env.TWILIO_WHATSAPP_WEBHOOK_URL = webhookUrl;

  const sent: { to: string; body: string; contentSid: string | null }[] = [];
  const fetchImpl: typeof fetch = async (input, init) => {
    const url = String(input);
    if (url.includes('api.twilio.com')) {
      const form = new URLSearchParams(String(init?.body ?? ''));
      sent.push({
        to: form.get('To') ?? '',
        body: form.get('Body') ?? '',
        contentSid: form.get('ContentSid'),
      });
      return new Response(JSON.stringify({ sid: 'SMtest' }), { status: 201 });
    }
    return new Response('{}', { status: 200 });
  };

  const config = loadConfig();
  const app = createApp({
    db,
    config: { ...config, appPublicUrl: 'https://example.com' },
    now: () => now,
    rateLimiter: new RateLimiter(100, 60_000, () => now),
    aiFetch: fetchImpl,
  });
  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>((resolve) => server.once('listening', () => resolve()));
  const port = (server.address() as { port: number }).port;

  try {
    db.prepare(
      `INSERT INTO whatsapp_link_codes (code, user_id, expires_at, created_at, consumed_at)
       VALUES ('654321', 'user-wa', ?, ?, NULL)`,
    ).run(new Date(now + 10 * 60_000).toISOString(), stamp);

    const params = {
      Body: 'LINK 654321',
      From: 'whatsapp:+27821234567',
      To: `whatsapp:${fromNumber}`,
    };
    const data = Object.keys(params).sort().reduce((acc, key) => `${acc}${key}${params[key as keyof typeof params]}`, webhookUrl);
    const signature = createHmac('sha1', authToken).update(Buffer.from(data, 'utf8')).digest('base64');
    const form = new URLSearchParams(params);
    const response = await fetch(`http://127.0.0.1:${port}/api/whatsapp/webhook`, {
      method: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        'x-twilio-signature': signature,
      },
      body: form.toString(),
    });
    assert.equal(response.status, 200);
    assert.match(await response.text(), /<Response><\/Response>/);

    const link = db.prepare('SELECT user_id AS userId, phone_e164 AS phone FROM whatsapp_links WHERE phone_e164 = ?')
      .get('+27821234567') as { userId: string; phone: string };
    assert.equal(link.userId, 'user-wa');
    assert.ok(sent.some((item) => item.body.includes('Lerato')));

    // Proactive new-piece tip inside the 24h session (link counted as inbound).
    const notify = await notifyNewPieceYoullLike({
      db,
      userId: 'user-wa',
      now,
      config: loadWhatsAppConfig(),
      fetchImpl,
      piece: {
        pieceName: 'Linen wrap blouse',
        colour: 'sand',
        reason: 'Matches your warm palette.',
      },
    });
    assert.equal(notify.ok, true);
    assert.equal(notify.delivery, 'session_text');
    assert.ok(sent.some((item) => item.body.includes('Linen wrap blouse')));
  } finally {
    await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
    delete process.env.WHATSAPP_ENABLED;
    delete process.env.TWILIO_ACCOUNT_SID;
    delete process.env.TWILIO_AUTH_TOKEN;
    delete process.env.TWILIO_WHATSAPP_FROM;
    delete process.env.TWILIO_WHATSAPP_WEBHOOK_URL;
  }
});

test('outside the session window a Content template is required for new-piece tips', async () => {
  const db = openDatabase(':memory:');
  migrate(db, loadConfig().migrationsDir);
  const now = Date.now();
  const stamp = new Date(now).toISOString();
  db.prepare(
    `INSERT INTO users (id, email, password_hash, status, created_at, updated_at, email_verified_at)
     VALUES ('user-wa2', 'wa2@example.com', 'x', 'active', ?, ?, ?)`,
  ).run(stamp, stamp, stamp);
  db.prepare(
    `INSERT INTO customer_profiles (user_id, display_name, completion_status, stylist_name, stylist_gender, stylist_age_vibe, stylist_voice, updated_at)
     VALUES ('user-wa2', 'Thandi', 'complete', 'Jules', 'non-binary', 'forties', 'direct-practical', ?)`,
  ).run(stamp);
  db.prepare(
    `INSERT INTO whatsapp_links (phone_e164, user_id, conversation_id, linked_at, updated_at, last_inbound_at, proactive_opt_in)
     VALUES ('+27820001111', 'user-wa2', NULL, ?, ?, ?, 1)`,
  ).run(stamp, stamp, new Date(now - 48 * 60 * 60 * 1000).toISOString());

  const config = loadWhatsAppConfig({
    WHATSAPP_ENABLED: 'true',
    TWILIO_ACCOUNT_SID: 'ACxxx',
    TWILIO_AUTH_TOKEN: 'token',
    TWILIO_WHATSAPP_FROM: '+27799927273',
  } as NodeJS.ProcessEnv);

  await assert.rejects(
    () => notifyNewPieceYoullLike({
      db,
      userId: 'user-wa2',
      now,
      config,
      fetchImpl: async () => new Response('{}', { status: 200 }),
      piece: { pieceName: 'Midi skirt' },
    }),
    /template|24-hour/i,
  );

  const withTemplate = loadWhatsAppConfig({
    WHATSAPP_ENABLED: 'true',
    TWILIO_ACCOUNT_SID: 'ACxxx',
    TWILIO_AUTH_TOKEN: 'token',
    TWILIO_WHATSAPP_FROM: '+27799927273',
    TWILIO_WHATSAPP_CONTENT_SID_STYLE_ALERT: 'HXstylealert',
  } as NodeJS.ProcessEnv);

  let contentSid: string | null = null;
  const result = await notifyNewPieceYoullLike({
    db,
    userId: 'user-wa2',
    now,
    config: withTemplate,
    fetchImpl: async (_input, init) => {
      const form = new URLSearchParams(String(init?.body ?? ''));
      contentSid = form.get('ContentSid');
      return new Response(JSON.stringify({ sid: 'SMtmpl' }), { status: 201 });
    },
    piece: { pieceName: 'Midi skirt', reason: 'Clean lines for your classic look.' },
  });
  assert.equal(result.delivery, 'template');
  assert.equal(contentSid, 'HXstylealert');
});
