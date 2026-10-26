# FASHN provider configuration

Server-only. Never put keys in Vite or browser code.

| Variable | Default | Purpose |
| --- | --- | --- |
| `FASHN_API_KEY` | empty | Bearer credential for `api.fashn.ai` |
| `FASHN_API_BASE_URL` | `https://api.fashn.ai/v1` | API base |
| `TRYON_ALLOW_LIVE` | `false` | Feature flag for live providers |
| `TRYON_LIVE_APPROVAL_ACK` | empty | Staging/production: must be `i-approve-paid-fashn-tryon` with live flag |
| `TRYON_MAX_BUDGET_USD` | `0` | Hard USD spend cap for live jobs |
| `TRYON_MAX_AUTO_RETRIES` | `0` | Clamped 0–1; account jobs do not auto-retry billable generation |
| `TRYON_PROVIDER_TIMEOUT_MS` | `90000` | Poll timeout |
| `TRYON_ALLOW_CUSTOMER_MOCK` | auto (dev/test only) | Allow labelled local mock in customer UI |
| `TRYON_CUSTOMER_CREDIT_COST` | `1` | Internal membership credits reserved per live job |

## Models

- Production default: `fashn-tryon-v1.6` → FASHN `tryon-v1.6`
- Future option only: `fashn-tryon-max` → `tryon-max` (not auto-selected)

## Safety

- Staging/production refuse `TRYON_ALLOW_LIVE=true` unless `TRYON_LIVE_APPROVAL_ACK=i-approve-paid-fashn-tryon` is also set.
- Idempotency keys prevent duplicate billable creates.
- If status is uncertain, poll the existing prediction ID; do not submit again without approval.
