# Data Model Plan

Status: account and profile tables are implemented in `server/api/migrations`. Migration `003_ai_conversations.sql` adds `ai_conversations`, `ai_messages`, and `ai_usage`. Conversations and messages belong to one user and are deleted together. Usage rows stay after deletion and do not store message text or API keys. Costs are `0` with status `zero` for the mock provider, `estimate` only when the operator supplies per-million rates, or `unpriced` when a live call cannot be billed from the response. There is no account-data export route yet. The React demonstration store is still `localStorage` and is not uploaded automatically.

Principles:

- The adult account owns personal rows.
- Photographs are files, not database blobs.
- Prices exist only as copied source facts with a verification time.
- Child subject processing is not modelled for the proof of concept.
- Identifiers are strings (UUID). Money is integer cents in ZAR (`price_cents`) so rand amounts do not use binary floats. Provider costs in another currency store `amount_minor`, `currency`, and `fx_note` as text supplied by the operator, not a guessed rate.

## Accounts and profile

`accounts`

- `id`, `email`, `password_hash` nullable if a one-time code is used instead
- `status` (`pending`, `active`, `disabled`)
- `is_adult` confirmed at registration
- `created_at`, `updated_at`

`profiles`

- `account_id` unique
- `preferred_name`, `age_range`, `height_cm`
- `country`, `currency`
- `tops_size`, `bottoms_size`, `dress_size`, `shoe_size`
- `bust_cm`, `waist_cm`, `hip_cm` nullable
- `fit_preference`, `experimentation`
- `budget_tier`
- `styles_json`, `favourite_colours_json`, `avoid_colours_json`, `retailers_json`
- `onboarding_completed_at`

This maps to the current `UserProfile` type without copying the demonstration person into new databases.

`consents`

- `id`, `account_id`, `purpose` (`profile`, `photo_storage`, `tryon_provider`, `shopping`)
- `granted_at`, `withdrawn_at`, `notice_version`, `provider_name` nullable

## Media

`media_objects`

- `id`, `account_id`
- `kind` (`person_photo`, `garment_photo`, `tryon_result`, `wardrobe_image`)
- `storage_key`, `content_type`, `byte_size`, `checksum_sha256`
- `created_at`, `deleted_at`

Deleted objects stay as tombstones so a job cannot keep serving a file the customer removed.

## Try-on and AI

`ai_tasks`

- `id`, `account_id`, `kind` (`style`, `tryon`, `shopping`, `beauty`, `wardrobe`, `profile`)
- `status`, `request_json`, `response_json`
- `provider`, `model`
- `started_at`, `finished_at`
- `cost_amount_minor`, `cost_currency`
- `error_code`

`tryon_jobs`

- `id`, `account_id`, `ai_task_id`
- `person_media_id`, `garment_media_id` or `catalogue_item_id`
- `provider_job_id`
- `result_media_id` nullable
- `status`

## Catalogue

`catalogue_items`

- `id`
- `source`, `source_product_id`, `product_url`
- `title`, `brand`, `category`, `colour`
- `image_url` nullable when display is not licensed
- `image_licence_note`
- `identity_key` nullable
- `last_verified_at`

`catalogue_offers`

- `id`, `catalogue_item_id`
- `retailer_name`
- `price_cents` nullable
- `price_status` (`known`, `unknown`)
- `currency`
- `size_status` (`listed`, `unspecified`)
- `sizes_json` nullable
- `in_stock` nullable, never defaulted to true
- `verified_at`
- `quality_state` matching the existing `RetailerDataQualityState` values

`offer_matches`

- `left_offer_id`, `right_offer_id`
- `relation` (`identical`, `similar`)
- `reason` (for example `same_gtin` or `title_only`)

Identical comparisons require `identity_key`. Title similarity alone is stored as `similar` and is not shown as one product with two prices.

## Wardrobe and saves

`wardrobe_items`

- `id`, `account_id`, `media_id` nullable
- `name`, `category`, `colour`, `brand`, `size`
- `created_at`

`wardrobe_outfits`

- `id`, `account_id`, `title`, `occasion`

`wardrobe_outfit_items`

- `outfit_id`, `wardrobe_item_id`

`saved_looks` and `saved_products` follow the current saved-item services, with `account_id` added.

Beauty saved looks can use `saved_looks` with `domain = 'beauty'` or a separate table. A separate table is clearer if beauty gains its own generator later.

## Entitlements

`credit_ledger`

- `id`, `account_id`, `delta`, `balance_after`
- `reason`, `ai_task_id` nullable
- `created_at`

Balances are the sum of the ledger, not a single mutable number that can drift. The current `mystyle_credits` object is a demonstration balance and is not migrated as if it were money.

`entitlements`

- `account_id`, `plan_code`, `source` (`manual`, `payment_provider`)
- `effective_from`, `effective_to`

No payment-provider tables until Phase 9.

## Administration

`audit_events`

- `id`, `actor_account_id`, `action`, `subject_type`, `subject_id`, `created_at`

## What is intentionally absent

- Family-member and child tables. The local prototype has them. The proof-of-concept database does not, until a later decision that complies with POPIA's additional rules for children.
- A scraped-page cache.
- Model-invented products.

## Mapping from the prototype

| Current store | Future table | Migration note |
| --- | --- | --- |
| `mystyle_ai_user_profile_v1` | `profiles` | Do not import the built-in Nandi profile as a real account |
| Wardrobe keys | `wardrobe_items` and outfits | Demonstration Unsplash items stay out of production accounts |
| Saved looks and products | save tables | Safe to import only for a user who created them and only while products are still marked `Demo Listing` |
| Membership keys | not migrated | Simulated credits are not a balance |
| Family keys | not migrated in the proof of concept | Includes child demonstration profiles |

## Shopping engine tables that now exist

The proposal above is still the account-level model. The shopping lab added a separate SQLite file, `server/shopping/private/catalogue.sqlite`, with these tables:

- `products` — normalised row, connector id, external id, nullable price cents, currency, availability, sale status, verification time, data class (`demo` or `licensed`), and `removed_at`.
- `variants` — original size label, size system, normalised label, confidence, variant price, availability, and GTIN.
- `product_images` — URLs only. The server does not download them.
- `price_observations` — a row is written when a supplied price changes. History is not backfilled.
- `source_payloads` — the normalised source object for that import.
- `import_runs` and `import_errors` — accepted, updated, removed, and rejected counts.

Missing values stay null. The HTTP layer maps them to an unavailable field. There is still no account table and no payment table in this database.
