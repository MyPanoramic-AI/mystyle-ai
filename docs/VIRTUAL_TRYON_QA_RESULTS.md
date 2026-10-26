# Virtual try-on QA results

Date: 26 October 2026. Local only. No push. No Render deploy. No paid FASHN calls.

## Suites

| Suite | Result |
| --- | --- |
| `npm run lint` | Pass |
| `npm run lint:api` | Pass |
| `npm run test:api` (includes `tryon.test.ts`) | Pass (69) |
| `npm run test:ai` | Pass (16) |
| `npm run test:tryon` (lab) | Pass (16) |

## Coverage added

- Successful mock generation with labelled demonstration media
- Invalid / missing person media
- Missing `external_photo_ai` consent for live provider
- Live mode disabled by default (`live_tryon_disabled`)
- Failed mock scenario
- Duplicate idempotency key
- Cross-account job isolation
- Mock does not change credit balance
- Wardrobe garment listing + `wardrobeItemId` job create
- `POST /api/tryon/prepare` reports live blockers without spending
- Authorised mocked FASHN path (`tryOnFetch`) stores `resultKind: 'provider'` (not demonstration stripes)
- Live readiness includes `ai.image` entitlement + credit balance checks

## Still disabled

- `TRYON_ALLOW_LIVE` (and production/Render refuse enabling it)
- Provider budget defaults to `0`
- No browser API keys
- No real FASHN credit spend; image quality of live FASHN has **not** been validated
