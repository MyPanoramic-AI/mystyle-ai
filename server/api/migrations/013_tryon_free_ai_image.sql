-- Enable virtual try-on on the Free plan: include ai.image entitlement keys.
-- Existing FREE subscriptions are updated so current accounts can generate when live is approved.

UPDATE plan_definitions
SET entitlement_keys_json = '["account.basic","ai.image"]',
    features_json = '["Account profile","Wardrobe and saved looks","Virtual try-on when live generation is approved"]'
WHERE plan_code = 'FREE' AND version = 1 AND status = 'published';

UPDATE subscription_entitlements
SET feature_keys_json = '["account.basic","ai.image"]',
    updated_at = datetime('now')
WHERE plan_code = 'FREE'
  AND status = 'active'
  AND feature_keys_json NOT LIKE '%ai.image%';
