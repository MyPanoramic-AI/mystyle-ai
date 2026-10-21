# Account security test report

Date: 21 October 2026. Email verification and password recovery. No live email provider. No push or deploy.

## Automated API coverage (`test:email` / included in `test:api`)

- New account unverified
- Verification success, expiry, reuse, resend supersede, concurrent confirm
- Password reset neutral unknown email, valid reset, expiry, short password, reuse, sequential double-consume
- Session revocation after reset; old password rejected; new password accepted
- Migration 010 leaves legacy `email_verified_at` null
- Mailbox list omits tokens; action endpoint returns path on loopback
- Sensitive export gated when `API_REQUIRE_EMAIL_VERIFIED=true`
- Capture refused in production config

## Chrome

`e2e/email-security.spec.ts`: register → verify via capture → reset via capture → old password fails → new password works → invalid link panel; smoke for Home, Profile, Wardrobe, Beauty.

Full `npm run test:e2e`: **25 passed**. Unique Node automated count with this phase: **106** (`test:api` 54 including email + infra, plus account 5, ai 16, shopping 15, tryon 16).

## Not claimed

- Production email delivery
- Deliverability or spam reputation
- POPIA legal sufficiency of verification wording
