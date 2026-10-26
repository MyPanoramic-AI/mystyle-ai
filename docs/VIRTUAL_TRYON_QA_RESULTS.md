# Virtual try-on QA results

Date: 26 October 2026. Local only. No push. No Render deploy. No additional paid FASHN calls in this integration pass.

## Suites

| Suite | Result |
| --- | --- |
| `npm run lint` | Pass |
| `npm run lint:api` | Pass |
| `npx tsc --noEmit --strict` | Pass |
| `npm run build` | Pass |
| `npm run test:api` | Pass (**71**) |
| `npm run test:account` | Pass (**5**) |
| `npm run test:ai` | Pass (**16**) |
| `npm run test:shopping` | Pass (**15**) |
| `npm run test:tryon` | Pass (**16**) |
| Playwright try-on / shop / journey subset | Pass (**11**) |

## Coverage

- Shop Try It On preload + photograph step
- Local development labelled mock (no FASHN hosts)
- Mock disabled when `allowCustomerMock=false`
- Fitting list + delete + cross-account isolation
- Live FASHN blocked without server flag
- Mocked FASHN provider path (API, no network)
- Wardrobe garment listing / prepare blockers
- Account deletion includes `tryon_jobs`; export includes try-on metadata

## Verified earlier (separate authorised session)

One real `tryon-v1.6` generation (~19.1s, 1 FASHN credit) — **not repeated** in this pass.

## Still unverified

- Broad live quality across garments/poses
- Production live activation on Render
- Commercial pricing / public plan allowances
