# Virtual try-on QA results

Date: 26 October 2026 (display-clarity fix). Local only. No push. No Render deploy. No additional paid FASHN calls.

## Suites

| Suite | Result |
| --- | --- |
| `npx tsx --test server/api/tests/tryon.test.ts` | Pass (**16**) |
| Playwright `e2e/tryon-simulate.spec.ts` | Pass (**5**) |

## Display-clarity coverage

- Confirm step: inputs only (“Your selected photo” / “Selected garment”); Result tab locked until success
- After panel binds `job.resultMediaId` via private media URL — never garment/shop preview
- Mock banner: “Demonstration output — not a real virtual try-on”
- Blocked live: consent / credits / entitlement / live-disabled prepare + create codes
- Failed job: no `resultMediaId`; fittings list empty
- Refresh / fittings restore owner result media; cross-account isolation

## Verified earlier (separate authorised session)

One real `tryon-v1.6` generation (~19.1s, 1 FASHN credit) — **not repeated** in this pass.

## Still unverified

- Broad live quality across garments/poses
- Production live activation on Render
- Commercial pricing / public plan allowances
