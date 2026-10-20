# Customer journey test matrix

Date: 20 October 2026. Environment: Playwright, Chrome, Vite at `http://127.0.0.1:4173`, API at `http://127.0.0.1:4341`, temporary SQLite under the system temp directory. Provider mock, live AI off, budget 0.

PASS means that browser test was executed and succeeded. An API test is listed only as supporting evidence and is never the reason for a browser PASS.

| ID | Feature | Steps | Expected | Observed | Status | Evidence | Defect |
| --- | --- | --- | --- | --- | --- | --- | --- |
| CJ1-01 | Registration and session | Register, reload, skip, open profile, sign out, sign in | Same adult account returns and no other account is shown | Onboarding remains after reload. Sign-in reaches Home. Chloe and Liam are absent | PASS | `e2e/customer-journeys.spec.ts` registration test | None |
| CJ1-02 | Invalid email | Submit `not-an-email` | Registration does not proceed | Native email `validationMessage` is non-empty and the create-account heading stays | PASS | Same file, invalid-registration test | None |
| CJ1-03 | Weak password | Valid email and a short password | A clear password error | Alert text: "Use a password of at least 12 characters." | PASS | Same test | None |
| CJ1-04 | Incorrect password | Sign in with the wrong password | Generic failure, no account data | Not clicked | NOT RUN | API auth test passed separately | None |
| CJ1-05 | Duplicate registration | Register the same email twice | Second attempt rejected | Not clicked | NOT RUN | API auth test passed separately | None |
| CJ1-06 | Missing backend | Open the app with the API stopped | Visible connection error | Not exercised | NOT RUN | None | None |
| CJ1-07 | Session expiration | Use an expired session | Protected data is refused and the sign-in screen returns | Not clicked | NOT RUN | API auth test covers expiry on the server | None |
| CJ2-01 | Onboarding navigation | Move through all eight stages | Each stage is reachable and the last action enters the app | Header shows 2 of 8 through 8 of 8. Explore MyStyle AI reaches Home | PASS | Onboarding test | K1, labels inside steps still say "of 6" |
| CJ2-02 | Answer retention | Select answers, go back, and check them | Previous answers remain | Skip was used. Answers were not selected | NOT RUN | None | None |
| CJ2-03 | Onboarding save | Complete a realistic profile and save | API stores the profile | Skip and Explore were used. Sizes, colours, interests, and budget were not entered | NOT RUN | None | None |
| CJ2-04 | Onboarding failure | Save while the API is unavailable | An accurate error, with no false success | Not exercised | NOT RUN | None | None |
| CJ2-05 | Returning customer | Sign in again and open onboarding data | Saved preferences return | Not clicked | NOT RUN | None | None |
| CJ2-06 | Skip and demonstration data | Skip onboarding | Demonstration family records are not imported | Skip reaches Home. David is absent after Explore. Chloe and Liam are absent after sign-in | PASS | Onboarding and registration tests | None |
| CJ3-01 | Profile edit | Change size, colours, and budget, then refresh, sign out, and sign in | The edited values persist for that account only | Profile was opened only to sign out | NOT RUN | API profile test passed separately | None |
| CJ4-01 | Add wardrobe piece | Add "QA linen shirt" and reload | The piece remains | Toast confirms the add. After reload, Browse All shows the name | PASS | Records test | None |
| CJ4-02 | Edit, outfit, schedule, delete | Edit the piece, build and schedule an outfit, then delete it | References stay consistent and deletion is confirmed | Not clicked | NOT RUN | API wardrobe tests passed separately | None |
| CJ4-03 | Owner-only upload | Upload a fixture image and request it as another account | Only the owner can read it | No image was uploaded | NOT RUN | API media test passed separately | D2 fixed the empty preview `src` |
| CJ5-01 | Discover and saved looks | Open a look, save twice, refresh, and remove it | Duplicate save is refused and removal persists | Discover was not opened | NOT RUN | None | None |
| CJ5-02 | Catalogue labelling | Read a Discover card | Inspiration is not labelled as a verified purchasable product | Not opened | NOT RUN | None | None |
| CJ6-01 | Family profile and event | Add adult "Sam", save a plan, reload, and sign in as another account | The plan persists and the other account cannot see Sam | Save confirmations appeared. The second account does not see Sam. Reload persistence of the plan itself was not asserted | PASS for create and isolation. Plan reload is PARTIAL | Records test | None |
| CJ6-02 | Dependent profile | Add a fictional dependent and edit preferences | Dependent cannot sign in and is not sent to AI | Not clicked | NOT RUN | API family test keeps dependents out of the AI boundary | None |
| CJ6-03 | Edit and remove | Edit the event and remove the profile | Participants update and the removal persists | Not clicked | NOT RUN | None | None |
| CJ6-04 | Child photograph | Attempt a child photograph upload | Upload is unavailable | No photograph control was used | NOT RUN | API media test refuses child, minor, and dependent purposes | None |
| CJ7-01 | Beauty save and restore | Save a hairstyle and combined look "QA wedding guest", reload, then remove it | The look returns and deletion persists | Both saves confirm. After reload, Saved shows "QA wedding guest". Deletion was not clicked | PASS for save and restore. Delete is NOT RUN | Records test | None |
| CJ7-02 | Makeup, nails, and outfit link | Save makeup, nails, and link an owned outfit | Links stay with the owner | Not clicked | NOT RUN | API beauty test passed separately | None |
| CJ7-03 | Makeover labelling | Open Beauty Studio | The screen does not present an AI customer makeover | "Preview generation is not yet available." is visible. No photograph was selected | PASS for that notice | Records test | None |
| CJ8-01 | Mock stylist | Ask a wedding question, reload, delete, reload | Labelled mock reply restores and then stays deleted | Demonstration label, mock reply, restore, and deletion all occurred | PASS | Stylist test | K2, reload returns to Home until My Stylist is opened |
| CJ8-02 | Consent and failures | Refuse consent, stop the provider, stop the API, expire the session | Each state has its own honest message | Not clicked | NOT RUN | API AI tests passed separately | None |
| CJ8-03 | No verified offer | Read the wedding reply | No invented price or retailer link is shown as a verified purchase | The reply is the mock sentence. The page does not contain "verified retailer shopping is not connected". A full price scan of recommendation cards was not done | PARTIAL | Stylist test. API mock test also rejects invented shop listings | None |
| CJ8-04 | Dependent boundary | Ask the stylist after a dependent exists | Dependent details are not retrieved automatically | Not asserted in the browser | NOT RUN | API family test | None |
| CJ9-01 | Demonstration shop | Open Shop | Prices and products are identified as demonstration data | The illustrative-mockups paragraph is visible | PASS | Shop test | None |
| CJ9-02 | Filters, cards, and stock | Use filters and open a product | Controls work and the app does not claim a stock check | Not clicked | NOT RUN | None | None |
| CJ10-01 | Try-on preview | Open Try On | The page says generation is inactive and shows no finished transformation | "Real try-on generation is not active" is visible. "Neural fitting model simulation" is absent | PASS | Shop and try-on test | None |
| CJ10-02 | Upload validation | Choose a photograph | Validation runs locally and nothing is sent to FASHN | Take Photo and Choose from Gallery were not clicked. No file was selected | NOT RUN | None | None |
| NAV-01 | Primary tabs | Open Home, My Stylist, Try On, Shop, and My Profile | Each destination opens | Each was opened at least once during the suite | PASS | Combined browser tests | None |
| NAV-02 | Secondary destinations | Open Discover, Wardrobe, Family, Beauty, Membership, Saved Looks, and Outfit Planner | Each destination opens | Wardrobe, Family, and Beauty opened from Home. Discover, Membership, Saved Looks, and Outfit Planner were not opened | PARTIAL | Records test | None |
| VIEW-01 | Overflow | Set widths 320, 375, 390, 768, 1024, and 1440 | No horizontal overflow | Home shell passes at all six widths after D1 | PASS | Width test | D1 corrected |
| VIEW-02 | Visual layout | Inspect clipping, overlap, modals, forms, and images at those widths | Editorial layout remains usable | No visual inspection and no screenshots | NOT VERIFIED | None | None |
| ISO-01 | Two-account browser isolation | Create records as A, sign in as B | B cannot see A's private records | B cannot see the wardrobe name, Sam, or the beauty look. Other record types were not created | PARTIAL | Records test | None |
| ISO-02 | Cross-account API | Request A's resource as B | Rejection without the record body | Not repeated as a new manual call. Included API tests passed | PASS as API evidence only | `test:api` isolation, media, wardrobe, family, beauty, and stylist cases | None |
