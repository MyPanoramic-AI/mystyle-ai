-- Private onboarding photograph slots on the adult customer profile.
-- Media bytes remain in media_assets; these columns hold owner-scoped references only.

ALTER TABLE customer_profiles ADD COLUMN portrait_media_id TEXT;
ALTER TABLE customer_profiles ADD COLUMN full_body_front_media_id TEXT;
ALTER TABLE customer_profiles ADD COLUMN full_body_additional_media_id TEXT;
