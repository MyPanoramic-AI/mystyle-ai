ALTER TABLE whatsapp_links ADD COLUMN last_inbound_at TEXT;
ALTER TABLE whatsapp_links ADD COLUMN last_outbound_at TEXT;
ALTER TABLE whatsapp_links ADD COLUMN proactive_opt_in INTEGER NOT NULL DEFAULT 1;

CREATE TABLE IF NOT EXISTS whatsapp_outbound_log (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  phone_e164 TEXT NOT NULL,
  kind TEXT NOT NULL,
  delivery TEXT NOT NULL,
  body_preview TEXT,
  twilio_sid TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_outbound_user ON whatsapp_outbound_log(user_id, created_at);
