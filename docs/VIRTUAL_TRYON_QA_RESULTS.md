# Virtual try-on QA results

Date: 26 October 2026. Local only. No push. No Render deploy. No paid FASHN calls.

## Suites

| Suite | Result |
| --- | --- |
| `npm run lint` / `lint:api` | Pass |
| `npm run test:api` (includes `tryon.test.ts`) | Pass (67) |
| `npm run test:ai` | Pass (16) |
| `npm run test:tryon` (lab) | Pass (16) |
| Playwright `tryon-simulate`, shop-stylist try-on, manage-photos | Pass (8) |

## Coverage added

- Successful mock generation with labelled demonstration media
- Invalid / missing person media
- Missing `external_photo_ai` consent for live provider
- Live mode disabled by default (`live_tryon_disabled`)
- Failed mock scenario
- Duplicate idempotency key
- Cross-account job isolation
- Mock does not change credit balance
- E2E Simulate Fit demonstration without FASHN network hosts

## Still disabled

- `TRYON_ALLOW_LIVE` (and production refuses enabling it)
- Provider budget defaults to `0`
- No browser API keys
