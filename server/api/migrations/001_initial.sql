CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  last_login_at TEXT
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  csrf_token TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS customer_profiles (
  user_id TEXT PRIMARY KEY,
  display_name TEXT,
  style_preferences_json TEXT NOT NULL DEFAULT '[]',
  tops_size TEXT,
  bottoms_size TEXT,
  dress_size TEXT,
  shoe_size TEXT,
  budget_tier TEXT,
  favourite_colours_json TEXT NOT NULL DEFAULT '[]',
  avoid_colours_json TEXT NOT NULL DEFAULT '[]',
  fashion_interests_json TEXT NOT NULL DEFAULT '[]',
  fit_preference TEXT,
  experimentation TEXT,
  country TEXT,
  currency TEXT,
  completion_status TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS profile_measurements (
  user_id TEXT PRIMARY KEY,
  height_cm INTEGER,
  bust_cm INTEGER,
  waist_cm INTEGER,
  hip_cm INTEGER
);

CREATE TABLE IF NOT EXISTS user_preferences (
  user_id TEXT PRIMARY KEY,
  privacy_json TEXT NOT NULL,
  notifications_json TEXT NOT NULL,
  ai_personalisation_consent INTEGER NOT NULL DEFAULT 0,
  marketing_opt_in INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS media_assets (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  storage_key TEXT NOT NULL,
  content_type TEXT NOT NULL,
  byte_size INTEGER NOT NULL,
  purpose TEXT NOT NULL,
  created_at TEXT NOT NULL,
  deleted_at TEXT,
  retain_until TEXT
);

CREATE TABLE IF NOT EXISTS family_relationships (
  id TEXT PRIMARY KEY,
  owner_user_id TEXT NOT NULL,
  display_name TEXT NOT NULL,
  member_kind TEXT NOT NULL,
  relationship_label TEXT,
  permission_level TEXT NOT NULL,
  access_status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS wardrobe_items (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  colour TEXT,
  size_label TEXT,
  media_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS saved_looks (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS saved_look_items (
  look_id TEXT NOT NULL,
  wardrobe_item_id TEXT NOT NULL,
  PRIMARY KEY (look_id, wardrobe_item_id)
);

CREATE TABLE IF NOT EXISTS saved_products (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  retailer_source TEXT NOT NULL,
  external_product_id TEXT NOT NULL,
  saved_at TEXT NOT NULL,
  UNIQUE (user_id, retailer_source, external_product_id)
);

CREATE TABLE IF NOT EXISTS subscription_entitlements (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  plan_code TEXT NOT NULL,
  status TEXT NOT NULL,
  effective_from TEXT NOT NULL,
  effective_to TEXT
);

CREATE TABLE IF NOT EXISTS credit_ledger (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  delta INTEGER NOT NULL,
  operation_ref TEXT,
  reason TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS audit_events (
  id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  actor_user_id TEXT,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  metadata_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);
