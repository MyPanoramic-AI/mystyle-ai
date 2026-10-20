# End-to-end test report

Date: 20 October 2026.

This report records checks that were executed in this session. A passing API test is not treated as proof that a screen was usable. Layout was not accepted from a screenshot. No screenshot was captured.

## Environment

- Application: local MyStyle AI React/Vite frontend and Express API.
- Browser: installed Google Chrome, launched by Playwright through `channel: 'chrome'`.
- Frontend: `http://127.0.0.1:4173`, started with `reuseExistingServer: false`.
- API: `http://127.0.0.1:4341`, bound to `127.0.0.1`.
- Database and media: a new directory under the operating-system temporary folder, `mystyle-qa-e2e`. `API_DATA_DIR` must be absolute. Render mode was left unset, so this path cannot redirect a Render deployment.
- The existing development listeners on ports 3000 and 4331 were not stopped and were not used as the test target.
- AI provider: `mock`. `AI_ALLOW_LIVE=false`. `AI_MAX_BUDGET_USD=0`.
- No OpenAI, Gemini, FASHN, retailer, email, or payment call was made.
- Accounts were fictional adults created during the run. No customer photograph was uploaded.
- Command: `npx playwright test` from the repository root. Script: `npm run test:e2e`.

## Browser result

The final suite contains 7 tests. The final execution passed 7, failed 0, and blocked 0. Duration was 33.5 seconds. An earlier execution in the same session failed 4 of 7; those failures are described under defects and were retested after the corrections.

| Suite | Executed | Passed | Failed | Blocked |
| --- | ---: | ---: | ---: | ---: |
| `e2e/customer-journeys.spec.ts` | 7 | 7 | 0 | 0 |

The 7 tests do not cover every step in the customer-journey specification. Steps that were not clicked are marked NOT RUN in `CUSTOMER_JOURNEY_TEST_MATRIX.md`. The complete-journey acceptance gate remains open.

## What the seven tests demonstrated

1. A new adult account can be registered. Reloading the browser stays on onboarding, which shows the session cookie restored the signed-in account. Skip, profile, sign-out, and sign-in with the same email then reach Home. The names Chloe and Liam are absent.
2. An invalid email is stopped by the browser's native email validation and remains on the registration form. A short password then shows the alert "Use a password of at least 12 characters."
3. Onboarding advances from step 2 through step 7 with Skip, shows "8 of 8", and enters the app with Explore MyStyle AI. The name David is absent. This walk does not fill a realistic profile.
4. Shop shows the existing "illustrative demonstration mockups" notice. Try On shows "Real try-on generation is not active" and does not show "Neural fitting model simulation".
5. My Stylist shows "Demonstration stylist. This is not a live model." A wedding question receives the local mock sentence beginning "For a wedding, a breathable midi". After reload, opening My Stylist shows that sentence again. New Session and Start Fresh Session show "The saved conversation was deleted." After another reload, opening My Stylist no longer shows that sentence. The sentence appears in a paragraph and a nested span of the same message; that is one visible copy.
6. One account can add a wardrobe piece named "QA linen shirt", a family profile named "Sam", a family event plan, one saved hairstyle, and a combined look named "QA wedding guest". Reload restores the look and the wardrobe piece. A second new account does not see those three names. The browser console reports no empty `src` warning during this journey.
7. After sign-in, the home shell has no horizontal overflow at 320, 375, 390, 768, 1024, and 1440 pixel widths. The check compares `scrollWidth` with the viewport. It is not a visual inspection of every screen.

## Automated regression

Commands were run from the repository root on 20 October 2026. All exited 0.

| Command | Result | Count |
| --- | --- | ---: |
| `npm run lint` | Pass | TypeScript `tsc --noEmit` |
| `npx tsc --noEmit --strict` | Pass | Frontend and shared project |
| `npx tsc --noEmit --strict -p server/api/tsconfig.json` | Pass | API project |
| `npm run build` | Pass, with the existing chunk warning | One JavaScript chunk, 909.60 kB |
| `npm run test:api` | Pass | 21 |
| `npm run test:account` | Pass | 5 |
| `npm run test:ai` | Pass | 16 |
| `npm run test:shopping` | Pass | 15 |
| `npm run test:tryon` | Pass | 16 |

`test:api` already includes the migration, authentication, profile, isolation, media, wardrobe, family, and beauty files. The wardrobe, family, and beauty files were not launched a second time. Counting them again would double-count 6 tests. The unique automated count is 73: 21 + 5 + 16 + 15 + 16. The 7 browser tests are separate, so the combined executed total is 80.

The new API test inside the 21 is "a test data directory stays off the development database unless Render is set".

The production bundle was scanned for `sk-proj-`, `sk-ant-`, `AIza`, `OPENAI_API_KEY`, `GEMINI_API_KEY`, `FASHN_API`, `API_KEY=`, and `BEGIN PRIVATE`. None of those strings were present. Secret values are not copied here.

## Account isolation

In the browser, account B did not see account A's wardrobe piece, family profile name, or saved beauty look. Profile fields, outfits, private images, stylist conversations, and saved products were not created under account A and then checked under account B in the browser.

The API isolation, media, wardrobe, family, beauty, and stylist tests passed in the same session and reject cross-account reads. Those results are server evidence, not a browser demonstration.

## Defects corrected and retested

| ID | Severity | Observed | Correction | Retest |
| --- | --- | --- | --- | --- |
| D1 | Medium | At 768px the header row was wider than the viewport. The desktop navigation became visible at the `md` breakpoint while the bottom navigation was hidden. | Desktop navigation is `hidden lg:flex`. Bottom navigation is `lg:hidden`. Main padding stays `pb-28` until `lg`. | The width loop passed, including 768 and 1024. |
| D2 | Low | The wardrobe add form rendered an image with an empty `src` before a photograph was chosen. Saved family outfit concepts also used an empty `src`, and the browser logged that an empty string was passed to `src`. | The wardrobe preview renders an image only when a URL exists. A saved family concept does the same. | The records journey passed with a console listener that fails if that warning returns. |

## Not claimed

- Discover, saved looks, outfit builder, outfit scheduling, profile editing, membership, consent refusal, session expiry, a missing backend, duplicate registration, and an incorrect password were not clicked in the browser.
- No screen was reviewed visually for clipping, overlap, or modal fit. The overflow check is numeric and covers the signed-in home shell only.
- Keyboard order, contrast, and touch-target size were not measured.
- Live model quality, FASHN generation, and retailer availability were not tested and must stay off.
