# Email verification implementation

Date: 21 October 2026. Local capture only. **No external email provider was activated.**

## Behaviour

1. Registration creates an `active` account with `email_verified_at` NULL.
2. A verification message is queued through the transactional mailer (local capture in development/test).
3. The customer opens `/?action=verify-email&token=…` on the configured `APP_PUBLIC_URL`.
4. `POST /api/auth/verify-email/confirm` consumes the token atomically and sets `email_verified_at`.
5. Signed-in customers can resend via `POST /api/auth/verify-email/request` (CSRF required).
6. Session and email-status responses expose `emailVerified` without tokens.

## Token security

- 32-byte random tokens (`base64url`); only SHA-256 hashes stored.
- Default lifetime: `API_VERIFICATION_TOKEN_MINUTES` (60).
- Single-use; concurrent confirm attempts allow one success.
- Resend supersedes outstanding tokens.
- Tokens are not returned by normal API responses and are not listed by `GET /api/dev/mailbox`.

## Unverified policy

| State | Login | Core app use | Export / deletion when `API_REQUIRE_EMAIL_VERIFIED=true` |
| --- | --- | --- | --- |
| Registered, unverified | Allowed | Allowed in this revision | Blocked |
| Verified | Allowed | Allowed | Allowed |
| Disabled / deleted | Blocked | Blocked | Blocked |

An email address on the account does **not** prove ownership until verified. Existing accounts are not silently marked verified — see `EXISTING_ACCOUNT_VERIFICATION_ROLLOUT.md`.

## Endpoints

| Method | Path | Auth |
| --- | --- | --- |
| GET | `/api/auth/email-status` | Session |
| POST | `/api/auth/verify-email/request` | Session + CSRF + rate limit |
| POST | `/api/auth/verify-email/confirm` | Public + rate limit |
