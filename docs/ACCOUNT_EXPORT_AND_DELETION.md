# Account export and deletion

Date: 21 October 2026.

## Export

`POST /api/privacy/export` requires a signed-in session, CSRF, and the current password. At most three exports per hour are accepted for an account.

The response points to a private ZIP under `exports/` with:

- `manifest.json` — export id, expiry, media file list
- `account.json` — account identity without the password hash, profile, preferences, consent history, family, wardrobe, looks, plans, beauty, AI conversations and messages, entitlements, credit ledger, provider costs, AI usage, and a media manifest
- `media/<id>` — owned private files that still exist

Excluded: password hashes, session secrets, CSRF tokens, API keys, operator tokens, other accounts, and browser demonstration `localStorage`.

Download uses the owner session only. Archives expire after about one hour. Export contents are not logged.

## Deletion

1. `POST /api/privacy/deletion/start` creates a pending request and returns the consequence text.
2. `POST /api/privacy/deletion/cancel` cancels a pending request without deleting data.
3. `POST /api/privacy/deletion/confirm` requires the current password, revokes sessions, deletes owned media files and personal tables, cancels the active entitlement, and anonymises the user row.

Progress is stored so a failed cleanup can be retried without restoring the account to service.

## What remains after deletion

Pending legal review, these stay linked to the tombstone user id:

- `credit_ledger`
- `provider_costs`
- `ai_usage`
- `audit_events`
- `consent_records`
- `account_deletion_requests`

The email becomes `deleted-<retentionSubjectId>@deleted.invalid`. Sign-in fails. Another account is not affected.

Deletion on one device does not clear browser demonstration data on other devices.
