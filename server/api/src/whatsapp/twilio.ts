import { createHmac, timingSafeEqual } from 'node:crypto';
import { toE164Phone, type WhatsAppConfig } from './whatsappConfig.js';

export function normalizeWhatsAppPhone(raw: string): string | null {
  return toE164Phone(raw);
}

export function validateTwilioSignature(
  authToken: string,
  signature: string | undefined,
  url: string,
  params: Record<string, string>,
): boolean {
  if (!signature || !authToken) return false;
  const data = Object.keys(params)
    .sort()
    .reduce((acc, key) => `${acc}${key}${params[key] ?? ''}`, url);
  const expected = createHmac('sha1', authToken).update(Buffer.from(data, 'utf8')).digest('base64');
  try {
    const a = Buffer.from(expected);
    const b = Buffer.from(signature);
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

async function postTwilioMessage(
  config: WhatsAppConfig,
  form: URLSearchParams,
  fetchImpl: typeof fetch,
): Promise<{ sid: string | null; ok: boolean; status: number; error: string | null }> {
  if (!config.enabled || !config.accountSid || !config.authToken || !config.fromNumber) {
    return { sid: null, ok: false, status: 0, error: 'whatsapp_disabled' };
  }
  const auth = Buffer.from(`${config.accountSid}:${config.authToken}`).toString('base64');
  const response = await fetchImpl(
    `https://api.twilio.com/2010-04-01/Accounts/${config.accountSid}/Messages.json`,
    {
      method: 'POST',
      headers: {
        authorization: `Basic ${auth}`,
        'content-type': 'application/x-www-form-urlencoded',
      },
      body: form.toString(),
    },
  );
  if (!response.ok) {
    const text = await response.text().catch(() => '');
    return { sid: null, ok: false, status: response.status, error: text.slice(0, 240) || `http_${response.status}` };
  }
  const payload = await response.json() as { sid?: string };
  return { sid: typeof payload.sid === 'string' ? payload.sid : null, ok: true, status: response.status, error: null };
}

function baseForm(config: WhatsAppConfig, toE164: string): URLSearchParams {
  const to = toE164.startsWith('whatsapp:') ? toE164 : `whatsapp:${toE164}`;
  const from = `whatsapp:${config.fromNumber}`;
  const form = new URLSearchParams();
  form.set('To', to);
  form.set('From', from);
  if (config.statusCallbackUrl) form.set('StatusCallback', config.statusCallbackUrl);
  return form;
}

/** Free-form body — only allowed inside WhatsApp's 24h customer-care window. */
export async function sendWhatsAppText(
  config: WhatsAppConfig,
  toE164: string,
  body: string,
  fetchImpl: typeof fetch = fetch,
): Promise<{ sid: string | null; ok: boolean; status: number; error: string | null }> {
  const form = baseForm(config, toE164);
  form.set('Body', body.slice(0, 1500));
  return postTwilioMessage(config, form, fetchImpl);
}

/**
 * Business-initiated template (Content Template Builder HX… SID).
 * Required outside the 24h session. Do not also set Body.
 */
export async function sendWhatsAppTemplate(
  config: WhatsAppConfig,
  toE164: string,
  contentSid: string,
  variables: Record<string, string>,
  fetchImpl: typeof fetch = fetch,
): Promise<{ sid: string | null; ok: boolean; status: number; error: string | null }> {
  const form = baseForm(config, toE164);
  form.set('ContentSid', contentSid);
  form.set('ContentVariables', JSON.stringify(variables));
  return postTwilioMessage(config, form, fetchImpl);
}
