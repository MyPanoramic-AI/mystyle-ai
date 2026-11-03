CREATE TABLE IF NOT EXISTS whatsapp_links (
  phone_e164 TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  conversation_id TEXT,
  linked_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_links_user ON whatsapp_links(user_id);

CREATE TABLE IF NOT EXISTS whatsapp_link_codes (
  code TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  consumed_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_link_codes_user ON whatsapp_link_codes(user_id);
