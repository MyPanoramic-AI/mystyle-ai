ALTER TABLE customer_profiles ADD COLUMN shoe_heel_comfort TEXT;
ALTER TABLE customer_profiles ADD COLUMN shoe_heel_occasion TEXT;
ALTER TABLE customer_profiles ADD COLUMN preferred_shoe_styles_json TEXT NOT NULL DEFAULT '[]';
