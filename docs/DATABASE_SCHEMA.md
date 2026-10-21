# Database schema

Date: 21 October 2026. Source of truth: `server/api/migrations/`, from `001_initial.sql` through `008_membership_accounting.sql`. The runner records applied files in `schema_migrations` and skips them on the next start.

The file database uses foreign keys, WAL, and a five-second busy timeout. Tests use an in-memory database, which does not use WAL. Migration `008_membership_accounting.sql` extends the entitlement and ledger tables and adds the membership tables below.

## Tables

| Table | Purpose |
| --- | --- |
| `users` | Email, scrypt password hash, status, created and updated times, last login |
| `sessions` | Session id, user id, SHA-256 token hash, CSRF token, expiry |
| `customer_profiles` | Display name, style list, sizes, budget, colours, interests, fit, experimentation, country, currency, age range, shopping priorities, favourite retailers, onboarding status, completion status |
| `profile_measurements` | Optional height, bust, waist, and hip in centimetres. Private. Not inferred from photographs |
| `user_preferences` | Privacy and notification JSON, AI personalisation consent, marketing opt-in. Defaults are off |
| `media_assets` | Owner, storage key, content type, byte size, purpose, created, deleted, retain-until |
| `family_relationships` | Owner, display name, `adult` or `dependent`, relationship label, viewer permission, style lists, sizes, and optional planned budget in cents. Migration `006_family_plans.sql` adds the preference columns. No date of birth and no photograph |
| `wardrobe_items` | Owner, name, category, colour, size, brand, seasons, occasions, notes, optional media id or image reference |
| `saved_looks` | Owner, title, notes, kind (`wardrobe_outfit`, `inspiration`, or `concept`), occasion, and optional source key |
| `saved_look_items` | Look id and wardrobe item id |
| `outfit_plans` | Owner, date, title, occasion, notes, and optional outfit id. Added in `005_wardrobe_planner.sql`. These are personal plans, separate from family events |
| `family_events` | Owner, title, date, occasion, formality, style direction, colour theme, planned budget in cents, notes, and status. Added in `006_family_plans.sql` |
| `family_event_participants` | Event id, family profile id or `self`, planned allocation in cents, and an outfit note |
| `beauty_preferences` | One row per account. Optional hairstyle, colour, makeup, nail, interest, and occasion lists, plus an optional planned budget range in cents. Added in `007_beauty_studio.sql` |
| `beauty_looks` | Owner, category, title, description, style, colour, occasion, planned budget in cents, source label, source key, inspiration image address, notes, and parts. Added in `007_beauty_studio.sql` |
| `beauty_outfit_links` | Beauty look id plus an outfit id or outfit-plan id owned by the same account |
| `saved_products` | Owner, retailer source, external product id, saved time. No price is stored |
| `subscription_entitlements` | Account, plan code, version, status, window, feature keys, and source. Registration inserts `FREE` / `active` / `account.basic`. A customer cannot insert a paid plan |
| `credit_ledger` | Integer delta, entry type, operation id, idempotency key, reason, and resulting balance. The balance is the sum of deltas |
| `plan_definitions` | Versioned FREE, PERSONAL, and FAMILY rows. Prices are provisional. Proposed allowances are unapproved |
| `credit_reservations` | Hold, consume, release, or unknown status for one operation |
| `credit_idempotency` | First response for an account, scope, and key |
| `provider_costs` | Provider, model, operation type, credits, usage units, currency, reported cost, estimated cost, cost status, and request status. Mock rows leave the cost amounts null |
| `allocation_periods` | One grant per account and period key |
| `billing_policies` | Rollover, expiry, and the paid-allocation flag. Defaults are undecided and paid allocation off |
| `audit_events` | Register, login, and membership operator actions |

## Differences from the earlier proposal

The planning document used `accounts` and put measurements on the profile row. The implemented names are `users`, `customer_profiles`, and `profile_measurements`. There is no checksum column and no separate consent table. Media purpose and the preference flags are the current record of intent. A job table is not in this database; try-on jobs remain in the try-on lab.

## Family and children

A dependent row stores a display name, a kind, a permission, and a status. It does not store a date of birth, a photograph, or clothing sizes. Browser demonstration children are not migrated. Child photographs are refused before they are written.
