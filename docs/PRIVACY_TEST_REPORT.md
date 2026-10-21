# Privacy test report

Date: 21 October 2026. No production customer data was modified. No OpenAI, Gemini, FASHN, retailer, or payment call was made.

## Commands

| Command | Result |
| --- | --- |
| `npm run lint` | Exit 0 |
| `npx tsc --noEmit --strict` | Exit 0 |
| `npx tsc -p server/api/tsconfig.json --noEmit --strict` | Exit 0 |
| `npm run build` | Exit 0. JavaScript chunk 921.19 kB, gzip 220.05 kB |
| `npm run test:api` | 34 passed, including 5 privacy tests |
| `npm run test:privacy` | 5 passed (same file as inside `test:api`) |
| `npm run test:account` | 5 passed |
| `npm run test:ai` | 16 passed |
| `npm run test:shopping` | 15 passed |
| `npm run test:tryon` | 16 passed |
| `npm run test:e2e` | 23 passed in Chrome, including the privacy journey |

Unique Node tests: 87 = 34 API + 5 account + 16 stylist + 15 shopping + 16 try-on + 1 onboarding unit test. Privacy tests are not double-counted. The 23 browser tests are additional.

## Privacy API coverage

- Default-off consent and grant/withdrawal history
- Export completeness, secret exclusion, account isolation, and expiry
- Deletion cancel, wrong password, confirm, session loss, ledger retention, survivor account intact
- Retention dry-run without deletion; destructive cleanup blocked when disabled
- ZIP helper and completed deletion leaving media files removed

## Browser coverage

Chrome registered a fictional adult, set and withdrew optional AI personalisation consent, saved a profile and photograph, deleted the photograph, requested an authenticated ZIP export, cancelled deletion once, rejected a wrong password, confirmed deletion, verified sign-in failure, and confirmed a second account still opened Privacy controls.

## Not claimed

- POPIA legal compliance
- Approved retention periods
- Production cleanup scheduler
- Live provider processing
