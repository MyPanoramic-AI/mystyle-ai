# Membership test report

Date: 21 October 2026. No payment provider, OpenAI, Gemini, FASHN, or retailer was called. The development database in `server/api/private` was not modified. The API tests used isolated in-memory databases, except the concurrency test, which used a temporary file database.

## Commands

| Command | Result |
| --- | --- |
| `npm run lint` | Exit 0 |
| `npx tsc --noEmit --strict` | Exit 0 |
| `npx tsc -p server/api/tsconfig.json --noEmit --strict` | Exit 0 |
| `npm run build` | Exit 0. JavaScript chunk 912.08 kB, gzip 218.27 kB |
| `npm run test:api` | 29 passed. This includes the 8 membership tests |
| `npm run test:membership` | 8 passed. These are the same tests as the membership file inside `test:api` |
| `npm run test:account` | 5 passed |
| `npm run test:ai` | 16 passed |
| `npm run test:shopping` | 15 passed |
| `npm run test:tryon` | 16 passed |
| `npx tsx --test src/components/onboarding/onboardingSteps.test.ts` | 1 passed |
| `npm run test:e2e` | 22 passed in Chrome. The first launch failed the existing registration accessibility scan because the page navigated during the scan. The rerun, after the registration heading was visible, passed 22 |

Unique Node tests: 82. That is 29 API, 5 account, 16 stylist, 15 shopping, 16 try-on, and 1 onboarding. The membership file is not counted a second time. The 22 browser tests are additional.

## What the membership tests covered

- Provisional FREE, PERSONAL, and FAMILY definitions, and a new account on Free with no credits.
- Customer rejection for plan assignment and credit grants, including a customer call to the operator route.
- Allocation, reservation, settlement, release, refund, and a repeated key that does not debit twice.
- An unknown outcome that keeps the hold until it is confirmed not billable.
- Expired and cancelled entitlements, a missing image feature, a dependent feature, and a second account with a zero balance.
- A monthly run that grants nothing until a test database marks an allowance approved, then refuses a second grant and refuses a paid grant while paid allocation is off.
- Expiry only after the policy is set to expire at the end of the period. The default policy expires nothing.
- Float, zero, and non-numeric credit values rejected, and a negative adjustment that would cross zero rejected.
- A failed mock operation that returns the hold, and a retry that does not charge it.
- Two SQLite connections where the second reservation cannot spend the same 10 credits.

## Browser

Chrome registered an account, opened Membership, and showed Account plan Free, status active, and test credits 0. Preview did not show a payment success and the account stayed Free after refresh. A second account stayed at 0 after the first account received 3 test credits. Operator calls then allocated 6, reserved 2, settled that hold, reserved another 2, and released it as a failure. The screen showed 4 test credits and still showed Free. No payment text appeared.

Registration, Home, and Shop reported no axe violations in the rerun summary. That is not a full WCAG claim. The membership screen itself was not part of the axe scan.

## Not verified

- A live acquirer, invoice, or webhook.
- An approved price, VAT treatment, rollover rule, or credit allowance.
- A real OpenAI or FASHN cost. Mock cost fields stayed null.
- Two browser sessions spending the same balance at the same moment. Concurrency was checked with two SQLite connections in the API test.
