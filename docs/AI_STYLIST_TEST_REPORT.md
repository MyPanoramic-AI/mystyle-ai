# AI Stylist Test Report

Date: 20 October 2026.

No live model was called. The Gemini success test uses a local fake HTTP response. Browser click-through was not run: this session has no browser automation tool.

## Commands

| Command | Result |
| --- | --- |
| `npm run lint` | Exit 0 |
| `npm run lint:api` | Exit 0 |
| `npx tsc --noEmit --strict` | Exit 0 |
| `npm run build` | Exit 0. Vite printed the existing `__dirname` warning and the existing chunk-size warning |
| `npm run test:ai` | 12 passed, 0 failed |
| `npm run test:account` | 5 passed, 0 failed |
| `npm run test:api` | 14 passed, 0 failed |
| `npm run test:tryon` | 16 passed, 0 failed |
| `npm run test:shopping` | 15 passed, 0 failed |

`npm run lint` was run in the same session immediately before `lint:api` and the strict check. The strict check covers the same frontend files and also exited 0 after the final type fix. The image-selection helper was corrected after that build, so the build result above does not include that one-line image change. `npm run lint` was run again after it.

## What the AI tests cover

- Coordinator routing for style, shopping, try-on, beauty, and wardrobe.
- Mock replies without prices or links.
- Schema rejection of incomplete output and of a price field on a garment.
- Profile minimisation, including consent off and measurements removed.
- The Gemini request URL and JSON mime type, with no network call while live mode is off.
- Conversation create, restore, idempotent resend, cross-account 404, deletion, and a zero-cost usage row.
- Consent hiding a saved colour, then including it after consent.
- Message length and rate limit.
- Shopping and try-on replies marked not connected.
- Missing credential and zero budget, with the fake fetch uncalled.
- Provider HTTP failure, timeout, and invalid JSON, without the test key in the response.
- A synthetic successful Gemini body stored as `source: live` with cost status `estimate`.
- All 26 evaluation prompts through the mock path or an unconnected specialist.

## Prompt 6.1 preparation, 20 October 2026

No live Gemini request was made. `npm run lint:api` exited 0. `npm run test:ai` then passed 13 tests, including a local proof that a second overlapping live call does not reach the provider. The full suite listed above was run before that adapter change and is recorded with the coordinator commit `de5dcd2`.

`gemini-2.5-flash` is still documented as stable. Standard paid pricing checked the same day is US$0.30 per 1M input text tokens and US$2.50 per 1M output tokens, including thinking tokens. `GEMINI_API_KEY` is not configured. Both development budgets remain 0. The proposed one-test ceiling of US$0.10 is not active, and the code cannot guarantee that Google will stay inside it if thinking tokens overflow.
