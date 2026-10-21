ALTER TABLE subscription_entitlements ADD COLUMN plan_version INTEGER NOT NULL DEFAULT 1;
ALTER TABLE subscription_entitlements ADD COLUMN entitlement_version INTEGER NOT NULL DEFAULT 1;
ALTER TABLE subscription_entitlements ADD COLUMN feature_keys_json TEXT NOT NULL DEFAULT '[]';
ALTER TABLE subscription_entitlements ADD COLUMN source TEXT NOT NULL DEFAULT 'legacy';
ALTER TABLE subscription_entitlements ADD COLUMN updated_at TEXT;

ALTER TABLE credit_ledger ADD COLUMN entry_type TEXT NOT NULL DEFAULT 'LEGACY';
ALTER TABLE credit_ledger ADD COLUMN operation_id TEXT;
ALTER TABLE credit_ledger ADD COLUMN idempotency_key TEXT;
ALTER TABLE credit_ledger ADD COLUMN resulting_balance INTEGER;

CREATE UNIQUE INDEX IF NOT EXISTS idx_one_active_entitlement
  ON subscription_entitlements (user_id)
  WHERE status = 'active';

CREATE TABLE IF NOT EXISTS plan_definitions (
  id TEXT PRIMARY KEY,
  plan_code TEXT NOT NULL,
  version INTEGER NOT NULL,
  display_name TEXT NOT NULL,
  indicative_monthly_zar INTEGER,
  billing_interval TEXT NOT NULL,
  features_json TEXT NOT NULL,
  entitlement_keys_json TEXT NOT NULL,
  proposed_monthly_credits INTEGER NOT NULL,
  allowance_status TEXT NOT NULL,
  family_capable INTEGER NOT NULL,
  status TEXT NOT NULL,
  price_status TEXT NOT NULL,
  effective_from TEXT NOT NULL,
  retired_on TEXT,
  UNIQUE (plan_code, version)
);

CREATE TABLE IF NOT EXISTS credit_reservations (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  operation_id TEXT NOT NULL UNIQUE,
  idempotency_key TEXT,
  amount INTEGER NOT NULL CHECK (amount > 0),
  status TEXT NOT NULL,
  provider TEXT NOT NULL,
  operation_type TEXT NOT NULL,
  feature_key TEXT NOT NULL,
  reason TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_reservation_idempotency
  ON credit_reservations (user_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;

CREATE TABLE IF NOT EXISTS credit_idempotency (
  user_id TEXT NOT NULL,
  scope TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  response_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (user_id, scope, idempotency_key)
);

CREATE TABLE IF NOT EXISTS provider_costs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  operation_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  model TEXT,
  operation_type TEXT NOT NULL,
  credits_consumed INTEGER,
  usage_units INTEGER,
  usage_unit TEXT,
  currency TEXT,
  reported_cost_minor INTEGER,
  estimated_cost_minor INTEGER,
  cost_status TEXT NOT NULL,
  request_status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS allocation_periods (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  period_key TEXT NOT NULL,
  plan_code TEXT NOT NULL,
  amount INTEGER NOT NULL,
  remaining INTEGER NOT NULL,
  expires_on TEXT,
  created_at TEXT NOT NULL,
  UNIQUE (user_id, period_key)
);

CREATE TABLE IF NOT EXISTS billing_policies (
  id TEXT PRIMARY KEY CHECK (id = 'current'),
  rollover_policy TEXT NOT NULL,
  expiry_policy TEXT NOT NULL,
  paid_allocation_enabled INTEGER NOT NULL,
  notes TEXT NOT NULL
);

INSERT INTO plan_definitions (
  id, plan_code, version, display_name, indicative_monthly_zar, billing_interval,
  features_json, entitlement_keys_json, proposed_monthly_credits, allowance_status,
  family_capable, status, price_status, effective_from
) VALUES
  (
    'free-v1', 'FREE', 1, 'Free', 0, 'none',
    '["Account profile","Wardrobe and saved looks"]',
    '["account.basic"]',
    2, 'unapproved',
    0, 'published', 'provisional', '2026-10-21T00:00:00.000Z'
  ),
  (
    'personal-v1', 'PERSONAL', 1, 'Personal', 99, 'month',
    '["Personal styling features","Proposed image allowance"]',
    '["account.basic","ai.text","ai.image"]',
    15, 'unapproved',
    0, 'published', 'provisional', '2026-10-21T00:00:00.000Z'
  ),
  (
    'family-v1', 'FAMILY', 1, 'Family', 179, 'month',
    '["Account-managed family allowance","No separate child subscriber"]',
    '["account.basic","ai.text","ai.image","family.managed"]',
    40, 'unapproved',
    1, 'published', 'provisional', '2026-10-21T00:00:00.000Z'
  );

INSERT INTO billing_policies (id, rollover_policy, expiry_policy, paid_allocation_enabled, notes)
VALUES (
  'current',
  'undecided',
  'undecided',
  0,
  'Rollover and expiry are not approved. Paid monthly allocations stay off. Proposed allowances of 2, 15 and 40 are not grants.'
);
