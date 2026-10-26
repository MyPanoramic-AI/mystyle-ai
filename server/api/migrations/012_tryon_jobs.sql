CREATE TABLE IF NOT EXISTS tryon_jobs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  status TEXT NOT NULL,
  provider_id TEXT NOT NULL,
  model TEXT NOT NULL,
  category TEXT NOT NULL,
  quality TEXT NOT NULL,
  person_media_id TEXT NOT NULL,
  garment_media_id TEXT NOT NULL,
  result_media_id TEXT,
  result_kind TEXT,
  demonstration INTEGER NOT NULL DEFAULT 0,
  credit_reservation_id TEXT,
  credit_operation_id TEXT,
  credits_reserved INTEGER,
  mock_scenario TEXT,
  error_code TEXT,
  error_message TEXT,
  provider_job_id TEXT,
  cancel_requested INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  started_at TEXT,
  finished_at TEXT,
  UNIQUE(user_id, idempotency_key),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_tryon_jobs_user_created ON tryon_jobs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tryon_jobs_status ON tryon_jobs(status);
