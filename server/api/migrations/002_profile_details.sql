ALTER TABLE customer_profiles ADD COLUMN age_range TEXT;
ALTER TABLE customer_profiles ADD COLUMN shopping_priorities_json TEXT NOT NULL DEFAULT '[]';
ALTER TABLE customer_profiles ADD COLUMN favourite_retailers_json TEXT NOT NULL DEFAULT '[]';
ALTER TABLE customer_profiles ADD COLUMN onboarding_status TEXT NOT NULL DEFAULT 'pending';
