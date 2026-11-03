export interface WhatsAppConfig {
  enabled: boolean;
  accountSid: string | null;
  authToken: string | null;
  /** E.164 without whatsapp: prefix — your own registered WhatsApp Business sender */
  fromNumber: string | null;
  /** Public HTTPS webhook URL Twilio should call */
  webhookPublicUrl: string | null;
  statusCallbackUrl: string | null;
  /**
   * Twilio Content Template SID (HX…) for business-initiated alerts
   * outside the 24-hour customer-care window (e.g. new piece you'll like).
   */
  styleAlertContentSid: string | null;
  /** Customer-care free-form window after last inbound message */
  sessionWindowMs: number;
}

/** South African mobile national → E.164 (0799927273 → +27799927273). */
export function toE164Phone(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const stripped = raw.replace(/^whatsapp:/i, '').trim();
  const digitsOnly = stripped.replace(/[^\d+]/g, '');
  if (!digitsOnly) return null;
  if (/^\+[1-9]\d{7,14}$/.test(digitsOnly)) return digitsOnly;
  if (/^0\d{9}$/.test(digitsOnly)) {
    // SA national mobile/landline (10 digits starting with 0)
    return `+27${digitsOnly.slice(1)}`;
  }
  if (/^27\d{9}$/.test(digitsOnly)) return `+${digitsOnly}`;
  if (/^\d{8,14}$/.test(digitsOnly)) return `+${digitsOnly}`;
  return null;
}

export function loadWhatsAppConfig(env: NodeJS.ProcessEnv = process.env): WhatsAppConfig {
  const accountSid = env.TWILIO_ACCOUNT_SID?.trim() || null;
  const authToken = env.TWILIO_AUTH_TOKEN?.trim() || null;
  const fromNumber = toE164Phone(env.TWILIO_WHATSAPP_FROM?.trim() || null);
  const enabled = env.WHATSAPP_ENABLED === 'true'
    && Boolean(accountSid)
    && Boolean(authToken)
    && Boolean(fromNumber);
  const windowHours = Number(env.TWILIO_WHATSAPP_SESSION_HOURS ?? '24');
  return {
    enabled,
    accountSid,
    authToken,
    fromNumber,
    webhookPublicUrl: env.TWILIO_WHATSAPP_WEBHOOK_URL?.trim() || null,
    statusCallbackUrl: env.TWILIO_WHATSAPP_STATUS_URL?.trim() || null,
    styleAlertContentSid: env.TWILIO_WHATSAPP_CONTENT_SID_STYLE_ALERT?.trim() || null,
    sessionWindowMs: Number.isFinite(windowHours) && windowHours > 0
      ? Math.floor(windowHours * 60 * 60 * 1000)
      : 24 * 60 * 60 * 1000,
  };
}
