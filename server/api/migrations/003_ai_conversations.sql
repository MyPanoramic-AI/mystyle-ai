CREATE TABLE ai_conversations (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  created_at TEXT NOT NULL,
  last_activity_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_ai_conversations_owner ON ai_conversations (user_id, last_activity_at);

CREATE TABLE ai_messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  recommendation_json TEXT,
  provider TEXT,
  model TEXT,
  idempotency_key TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (conversation_id) REFERENCES ai_conversations(id) ON DELETE CASCADE
);

CREATE INDEX idx_ai_messages_conversation ON ai_messages (conversation_id, created_at);

CREATE UNIQUE INDEX idx_ai_messages_idempotency
  ON ai_messages (conversation_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;

CREATE TABLE ai_usage (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  conversation_id TEXT,
  operation_type TEXT NOT NULL,
  provider TEXT NOT NULL,
  model TEXT,
  input_tokens INTEGER,
  output_tokens INTEGER,
  cost_usd REAL,
  cost_status TEXT NOT NULL,
  request_status TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX idx_ai_usage_owner ON ai_usage (user_id, created_at);
