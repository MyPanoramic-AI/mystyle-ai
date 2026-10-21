CREATE TABLE IF NOT EXISTS privacy_notice_versions (
  version TEXT PRIMARY KEY,
  published_at TEXT,
  status TEXT NOT NULL,
  title TEXT NOT NULL,
  summary_json TEXT NOT NULL,
  contact_placeholder TEXT NOT NULL,
  notes TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS consent_records (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  purpose TEXT NOT NULL,
  status TEXT NOT NULL,
  notice_version TEXT NOT NULL,
  capture_method TEXT NOT NULL,
  evidence_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_consent_user_purpose_created
  ON consent_records (user_id, purpose, created_at);

CREATE TABLE IF NOT EXISTS data_export_jobs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  status TEXT NOT NULL,
  storage_key TEXT,
  byte_size INTEGER,
  media_count INTEGER NOT NULL DEFAULT 0,
  expires_at TEXT,
  error_code TEXT,
  created_at TEXT NOT NULL,
  completed_at TEXT
);

CREATE TABLE IF NOT EXISTS account_deletion_requests (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  status TEXT NOT NULL,
  retention_subject_id TEXT NOT NULL,
  progress_json TEXT NOT NULL,
  cancelled_at TEXT,
  completed_at TEXT,
  error_code TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS retention_policies (
  category TEXT PRIMARY KEY,
  policy_status TEXT NOT NULL,
  retention_days INTEGER,
  action_on_expiry TEXT NOT NULL,
  notes TEXT NOT NULL
);

INSERT INTO privacy_notice_versions (
  version, published_at, status, title, summary_json, contact_placeholder, notes
) VALUES (
  'draft-0',
  NULL,
  'draft',
  'MyStyle AI Privacy Notice (Draft for legal review)',
  '{"purposes":["Account authentication","Style profile and wardrobe storage","Optional AI personalisation when consented","Optional marketing when consented","Membership and credit accounting"],"categories":["Contact details","Style preferences","Optional measurements","Family planning labels","Wardrobe and beauty records","Private photographs","AI conversation text when used","Usage and credit metadata"],"thirdParties":["None connected in this revision. Future processors would be listed here after review."],"rights":["Access","Correction","Withdrawal of optional consent","Deletion request","Complaint to the Information Regulator"],"retention":"Retention periods are not approved. See the retention draft.","crossBorder":"No cross-border processor is active. Any future transfer needs legal review."}',
  'privacy-contact-to-be-confirmed@example.invalid',
  'This is a technical placeholder. It is not a legally approved privacy notice.'
);

INSERT INTO retention_policies (category, policy_status, retention_days, action_on_expiry, notes) VALUES
  ('inactive_accounts', 'undecided', NULL, 'review', 'No automatic purge of inactive accounts.'),
  ('expired_sessions', 'configured', 0, 'delete', 'Expired session rows may be removed. They are not personal content.'),
  ('temporary_uploads', 'configured', 30, 'delete', 'Matches API_MEDIA_RETENTION_DAYS for unused media. Destructive cleanup stays off until activated.'),
  ('deleted_account_personal', 'configured', 0, 'delete', 'Personal profile content is removed when deletion completes.'),
  ('ai_conversations', 'configured', 0, 'delete', 'Conversations are removed with the account or when the customer deletes them.'),
  ('ai_usage_metadata', 'undecided', NULL, 'retain_pseudonymous', 'May be needed for cost accounting. Keep with tombstone user id until legal review.'),
  ('test_data', 'configured', 0, 'delete', 'Isolated test databases and temporary export files only.'),
  ('audit_events', 'undecided', NULL, 'retain_pseudonymous', 'Security and privacy-request evidence may need retention. Pending legal review.'),
  ('credit_and_financial', 'undecided', NULL, 'retain_pseudonymous', 'Ledger integrity. Customer email is removed; UUID tombstone remains pending review.'),
  ('privacy_request_evidence', 'undecided', NULL, 'retain', 'Export and deletion request metadata may need retention. Pending legal review.'),
  ('consent_history', 'undecided', NULL, 'retain_pseudonymous', 'Consent grant and withdrawal history may be needed as evidence. Pending legal review.');
