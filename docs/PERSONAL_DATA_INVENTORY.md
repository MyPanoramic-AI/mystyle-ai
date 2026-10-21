# Personal data inventory

Date: 21 October 2026. This inventory describes technical storage. It is not a POPIA compliance certificate.

| Category | Purpose | Owner | Storage | Access | Proposed retention |
| --- | --- | --- | --- | --- | --- |
| Account identity | Sign-in | Account holder | `users` (email, status, timestamps; password hash) | Owner session; operator audit of events only | Active while the account exists. After deletion the email is replaced with a tombstone address. Password hash is replaced with an unusable value. |
| Sessions | Authentication | Account holder | `sessions` (token hash, CSRF, expiry) | Server only | Remove when expired or on logout/deletion. Policy: configured. |
| Style profile | Styling | Account holder | `customer_profiles` | Owner session | Delete on account deletion. |
| Measurements | Fit guidance | Account holder | `profile_measurements` | Owner session | Delete on account deletion. Not inferred from photographs. |
| Preferences | Product settings | Account holder | `user_preferences` | Owner session | Deleted with the account. Consent history is separate. |
| Consent history | Optional processing choices | Account holder | `consent_records` | Owner session | Default off. Retention of history after deletion is undecided (evidence). |
| Family profiles and events | Family outfit planning | Account holder | `family_relationships`, `family_events`, `family_event_participants` | Owner session | Delete on account deletion. Dependents are not separate accounts. No DOB or child photographs. |
| Wardrobe and plans | Personal clothing records | Account holder | `wardrobe_items`, `outfit_plans`, `saved_looks`, `saved_look_items`, `saved_products` | Owner session | Delete on account deletion. |
| Beauty records | Inspiration looks | Account holder | `beauty_preferences`, `beauty_looks`, `beauty_outfit_links` | Owner session | Delete on account deletion. |
| Private photographs | Wardrobe/profile images | Account holder | `media_assets` + files under private `media/` | Owner session | Soft-delete and file removal on request or account deletion. Temporary retention days configurable. Destructive bulk cleanup off by default. |
| AI conversations | Stylist chat | Account holder | `ai_conversations`, `ai_messages` | Owner session | Delete with conversation or account. Live providers remain off. |
| AI usage metadata | Cost controls | Operator / accounting | `ai_usage` | Owner summary; operator totals | Undecided. Kept on tombstone user id after deletion pending review. |
| Membership entitlements | Feature gates | Account holder | `subscription_entitlements` | Owner session; operator assignment | Cancelled on deletion. |
| Credit ledger and reservations | Internal credits | Account / accounting | `credit_ledger`, `credit_reservations`, `allocation_periods`, `credit_idempotency` | Owner reads; operator mutations | Ledger kept with tombstone user id pending legal review. Reservations and idempotency cleared on deletion. |
| Provider cost rows | Spend monitoring | Accounting | `provider_costs` | Owner summary; operator | Undecided. Kept with tombstone user id. |
| Audit events | Security and privacy requests | Operator | `audit_events` | Admin bearer | Undecided. May need retention for security and request evidence. |
| Export archives | Data portability | Account holder | `data_export_jobs` + private `exports/*.zip` | Owner download only | Expire after about one hour. Not public. |
| Deletion requests | Right to erasure workflow | Account holder | `account_deletion_requests` | Owner; audit | Undecided evidence retention. |
| Privacy notice drafts | Notice versioning | Operator | `privacy_notice_versions` | Authenticated read of draft | Draft until legal approval. |
| Retention policy rows | Configuration | Operator | `retention_policies` | Admin read | Configuration only. |
| Browser demonstration data | Prototype UI | Browser profile | `localStorage` keys listed in `SECURITY_REVIEW.md` | Same browser origin | Separate from the account. Clear-local action does not delete the server account. |
| Try-on / shopping labs | Lab experiments | Lab process | Separate lab storage | Lab tokens | Independent of the account API. Not included in account export. |
| Test databases | Automated tests | Developer | Temporary dirs / `:memory:` | Tests only | Deleted with the test process. |

## Backup requirements

File SQLite and private media need an operator backup plan before public hosting. No backup job is implemented in this revision. Ephemeral Render disks must not be treated as durable personal-data storage without a reviewed backup design.
