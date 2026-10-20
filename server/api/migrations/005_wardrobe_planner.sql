ALTER TABLE wardrobe_items ADD COLUMN brand TEXT;
ALTER TABLE wardrobe_items ADD COLUMN subcategory TEXT;
ALTER TABLE wardrobe_items ADD COLUMN colour_hex TEXT;
ALTER TABLE wardrobe_items ADD COLUMN seasons_json TEXT NOT NULL DEFAULT '[]';
ALTER TABLE wardrobe_items ADD COLUMN occasions_json TEXT NOT NULL DEFAULT '[]';
ALTER TABLE wardrobe_items ADD COLUMN notes TEXT;
ALTER TABLE wardrobe_items ADD COLUMN fabric TEXT;
ALTER TABLE wardrobe_items ADD COLUMN care_note TEXT;
ALTER TABLE wardrobe_items ADD COLUMN pairing_notes TEXT;
ALTER TABLE wardrobe_items ADD COLUMN image_url TEXT;
ALTER TABLE wardrobe_items ADD COLUMN is_favorite INTEGER NOT NULL DEFAULT 0;
ALTER TABLE wardrobe_items ADD COLUMN is_capsule INTEGER NOT NULL DEFAULT 0;
ALTER TABLE wardrobe_items ADD COLUMN times_worn INTEGER NOT NULL DEFAULT 0;
ALTER TABLE wardrobe_items ADD COLUMN last_worn_at TEXT;

ALTER TABLE saved_looks ADD COLUMN kind TEXT NOT NULL DEFAULT 'wardrobe_outfit';
ALTER TABLE saved_looks ADD COLUMN occasion TEXT;
ALTER TABLE saved_looks ADD COLUMN season TEXT;
ALTER TABLE saved_looks ADD COLUMN description TEXT;
ALTER TABLE saved_looks ADD COLUMN source_key TEXT;
ALTER TABLE saved_looks ADD COLUMN slots_json TEXT;
ALTER TABLE saved_looks ADD COLUMN is_favorite INTEGER NOT NULL DEFAULT 0;
ALTER TABLE saved_looks ADD COLUMN wear_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE saved_looks ADD COLUMN last_worn_at TEXT;
ALTER TABLE saved_looks ADD COLUMN harmony_score INTEGER;
ALTER TABLE saved_looks ADD COLUMN harmony_note TEXT;
ALTER TABLE saved_looks ADD COLUMN palette_json TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS saved_looks_source_unique ON saved_looks(user_id, kind, source_key) WHERE source_key IS NOT NULL;

CREATE TABLE IF NOT EXISTS outfit_plans (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  plan_date TEXT NOT NULL,
  occasion TEXT,
  notes TEXT,
  outfit_id TEXT,
  time_label TEXT,
  location_label TEXT,
  weather_label TEXT,
  completed INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS outfit_plans_owner ON outfit_plans(user_id, plan_date);
