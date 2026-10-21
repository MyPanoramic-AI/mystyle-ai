# Transactional email integration

Date: 21 October 2026.

## Abstraction

`Mailer` in `server/api/src/email/types.ts` accepts structured outbound messages (`email_verification`, `password_reset`, `password_changed`, `security_alert`). Templates in `templates.ts` render plain text and HTML with MyStyle AI branding. Links are built from `APP_PUBLIC_URL` / public HTTPS origin — never from `Host` headers.

## Providers

| Provider | When |
| --- | --- |
| `local_capture` | Development/test when `EMAIL_CAPTURE_ENABLED` is not `false` |
| `disabled` | Hosted profiles, or capture off |

A live transactional provider adapter is **not** implemented. Purchasing or registering one requires explicit approval.

## Local mailbox

Only when `appEnv` is `development` or `test` **and** capture is enabled:

- `GET /api/dev/mailbox` — metadata without tokens (loopback only)
- `GET /api/dev/mailbox/:id/action` — returns the relative action path for local follow-through (loopback only)

Staging/production refuse `EMAIL_CAPTURE_ENABLED=true` at config load.

## Marketing vs transactional

These messages are account security transactions. They are not marketing mail and must not be gated on marketing opt-in. Marketing consent remains a separate preference.
