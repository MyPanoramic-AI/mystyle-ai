ALTER TABLE family_relationships ADD COLUMN linked_user_id TEXT;

CREATE TABLE IF NOT EXISTS family_link_invites (
  id TEXT PRIMARY KEY,
  from_user_id TEXT NOT NULL,
  to_email TEXT NOT NULL,
  to_user_id TEXT,
  relationship_label TEXT,
  status TEXT NOT NULL,
  token_hash TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  responded_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_family_link_invites_from ON family_link_invites(from_user_id, status);
CREATE INDEX IF NOT EXISTS idx_family_link_invites_to_email ON family_link_invites(to_email, status);
CREATE INDEX IF NOT EXISTS idx_family_link_invites_to_user ON family_link_invites(to_user_id, status);
CREATE INDEX IF NOT EXISTS idx_family_relationships_linked ON family_relationships(linked_user_id);
