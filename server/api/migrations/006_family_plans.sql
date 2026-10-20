ALTER TABLE family_relationships ADD COLUMN styles_json TEXT NOT NULL DEFAULT '[]';
ALTER TABLE family_relationships ADD COLUMN colours_json TEXT NOT NULL DEFAULT '[]';
ALTER TABLE family_relationships ADD COLUMN occasions_json TEXT NOT NULL DEFAULT '[]';
ALTER TABLE family_relationships ADD COLUMN sizes_json TEXT NOT NULL DEFAULT '{}';
ALTER TABLE family_relationships ADD COLUMN categories_json TEXT NOT NULL DEFAULT '[]';
ALTER TABLE family_relationships ADD COLUMN comfort_json TEXT NOT NULL DEFAULT '[]';
ALTER TABLE family_relationships ADD COLUMN budget_cents INTEGER;

CREATE TABLE IF NOT EXISTS family_events (
  id TEXT PRIMARY KEY,
  owner_user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  event_date TEXT,
  occasion TEXT NOT NULL,
  formality TEXT,
  style_direction TEXT,
  colour_theme_json TEXT NOT NULL DEFAULT '{}',
  total_budget_cents INTEGER NOT NULL,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'planned',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS family_event_participants (
  event_id TEXT NOT NULL,
  member_id TEXT NOT NULL,
  allocated_budget_cents INTEGER NOT NULL DEFAULT 0,
  outfit_note TEXT,
  PRIMARY KEY (event_id, member_id),
  FOREIGN KEY (event_id) REFERENCES family_events(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS family_events_owner ON family_events(owner_user_id, event_date);
CREATE INDEX IF NOT EXISTS family_event_participants_member ON family_event_participants(member_id);
