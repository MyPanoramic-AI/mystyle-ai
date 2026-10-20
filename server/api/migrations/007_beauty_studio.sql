CREATE TABLE IF NOT EXISTS beauty_preferences (
  user_id TEXT PRIMARY KEY,
  hairstyles_json TEXT NOT NULL DEFAULT '[]',
  hair_colours_json TEXT NOT NULL DEFAULT '[]',
  makeup_styles_json TEXT NOT NULL DEFAULT '[]',
  nail_styles_json TEXT NOT NULL DEFAULT '[]',
  nail_colours_json TEXT NOT NULL DEFAULT '[]',
  interests_json TEXT NOT NULL DEFAULT '[]',
  occasions_json TEXT NOT NULL DEFAULT '[]',
  budget_min_cents INTEGER,
  budget_max_cents INTEGER,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS beauty_looks (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  style_label TEXT,
  colour_label TEXT,
  colour_hex TEXT,
  occasion TEXT,
  budget_cents INTEGER,
  source_label TEXT,
  source_key TEXT,
  image_url TEXT,
  notes TEXT,
  parts_json TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS beauty_looks_source ON beauty_looks(user_id, source_key) WHERE source_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS beauty_looks_owner ON beauty_looks(user_id, category);

CREATE TABLE IF NOT EXISTS beauty_outfit_links (
  id TEXT PRIMARY KEY,
  look_id TEXT NOT NULL,
  outfit_id TEXT,
  plan_id TEXT,
  FOREIGN KEY (look_id) REFERENCES beauty_looks(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS beauty_link_outfit ON beauty_outfit_links(look_id, outfit_id) WHERE outfit_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS beauty_link_plan ON beauty_outfit_links(look_id, plan_id) WHERE plan_id IS NOT NULL;
