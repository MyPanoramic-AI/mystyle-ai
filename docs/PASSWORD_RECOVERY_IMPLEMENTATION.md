# Password recovery implementation

Date: 21 October 2026. Local capture only. **No real email was sent.**

## Customer flow

1. Forgot password → email form.
2. API always returns the same neutral acceptance message.
3. If an active account exists, a single-use reset token is stored (hash only) and a message is captured locally.
4. Customer opens `/?action=reset-password&token=…`.
5. New password (≥12 characters) is submitted to `POST /api/auth/password-reset/confirm`.
6. Password hash is replaced, **all sessions for that user are deleted**, outstanding reset tokens are superseded, and a password-changed notice is queued.
7. Customer signs in with the new password.

## Security controls

- Neutral responses for unknown and known emails.
- Token hashes only; configurable expiry (`API_RESET_TOKEN_MINUTES`, default 30).
- Atomic consume; reused and expired tokens fail.
- Auth rate limiting on request and confirm.
- No temporary passwords and no email of the current password.
- Account-deletion and export reauthentication continue to use `assertRecentPassword` against the current hash.

## Endpoints

| Method | Path | Notes |
| --- | --- | --- |
| POST | `/api/auth/password-reset/request` | Public, rate limited, neutral body |
| POST | `/api/auth/password-reset/confirm` | Public, rate limited; clears session cookie |
