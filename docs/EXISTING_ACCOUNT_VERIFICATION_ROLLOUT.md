# Existing account verification rollout

Date: 21 October 2026.

## Migration behaviour (implemented)

Migration `010_email_account_security.sql` adds `users.email_verified_at` without backfilling it. Every existing row remains `NULL` (unverified). Password hashes, sessions, and profile data are untouched.

## Policy

1. Do **not** bulk-mark existing accounts as verified. An email on file is not proof of ownership.
2. Keep login and core styling features available for unverified accounts during the transition.
3. Leave `API_REQUIRE_EMAIL_VERIFIED=false` until customers have been notified and given time to verify.
4. When enabling the flag, export and account deletion become blocked until verification succeeds.
5. After a live mailer is approved, send a one-time verification campaign from a controlled operator process — not from this repository’s capture adapter.

## Operator checklist before requiring verification

- [ ] Live transactional provider approved and tested on staging
- [ ] `APP_PUBLIC_URL` points at the public HTTPS origin
- [ ] Customers notified with a verification window
- [ ] Support path documented for expired links
- [ ] Staging drill of export/deletion gates with the flag on
