# Known issues

Date: 20 October 2026. Corrected items stay listed so the retest is traceable. Open items are not commercial-launch blockers by themselves unless the release review says so.

## Corrected in this pass

### D1 — Header overflows at 768px

- Severity: medium.
- The desktop navigation appeared at Tailwind's `md` breakpoint. At exactly 768px the header contents were wider than the viewport, and the bottom navigation was already hidden.
- Correction: desktop navigation starts at `lg`. Bottom navigation and the extra bottom padding remain until `lg`.
- Retest: the home shell no longer overflows at 320, 375, 390, 768, 1024, or 1440.

### D2 — Empty image source

- Severity: low.
- The wardrobe add preview and saved family concept cards rendered `<img src="">`. Chrome warned that this can make the browser request the page again.
- Correction: both components omit the image when the URL is empty. Saved plans still do not have concept photographs; the API stores the outfit note only.
- Retest: the records browser journey records console errors containing "empty string" and fails if any appear. The retest passed.

## Open

### K1 — Onboarding step copy disagrees with the header

- Severity: low.
- The header counts eight stages. Six step bodies still say "Step N of 6".
- The journey can still be completed. The copy should be aligned before a customer pilot.
- Corrected on 21 October 2026. See the later section. The current labels use one eight-step sequence.

### K2 — Refresh does not restore the current section

- Severity: medium for deep links. It is not data loss.
- **Updated 21 October 2026 (Prompt 15):** primary tab and hub subpage (discover/family/wardrobe/beauty/membership) restore from `sessionStorage`. Inner tabs (e.g. Beauty category) still reset. Not a full URL router.
- Retest: `e2e/navigation-restore.spec.ts`.

### K3 — Large client download

- Severity: low for local testing. It matters before a public launch.
- Editorial JPEGs remain about 605 kB to 989 kB.
- **Updated 21 October 2026 (Prompt 15):** Discover, Family, Wardrobe, Beauty, and Membership are lazy-loaded. Main JS chunk measured **639.48 kB** gzip **169.47 kB** (was ≈ **926 kB** before the split). Further splitting and image compression remain open.

### K4 — Browser coverage is incomplete

- Severity: high as an acceptance gap, not as a broken feature that was observed.
- Discover, profile editing, outfit building and scheduling, wardrobe deletion, makeup and nail saves, beauty deletion, outfit links, membership, consent refusal, session expiry, a stopped API, duplicate registration, and a wrong password were not clicked.
- Visual layout at the six widths was not inspected. The end-to-end acceptance gate stays open until those steps are executed or explicitly waived.
- On 21 October those journeys were executed. The current exceptions are listed as K4 in the later section. This 20 October description is the record of what had not been clicked yet.

## Commercial gaps already known

These are not new defects from this run. They remain launch blockers and are listed in `RELEASE_READINESS.md`.

- Live OpenAI and Gemini quality are untested. Live calls stay disabled.
- Live FASHN quality is untested. No photograph was sent.
- There is no verified retailer feed. Shop copy identifies demonstration data.
- Account recovery and email verification exist with **local capture only**; live email is pending.
- Personal photograph onboarding slots are wired to private media with `private_photo_storage` consent (22 October 2026 / Prompt 16). Live external photo AI remains off.
- POPIA certification, image licensing, subscription billing, and approved legal notices remain incomplete (technical export/deletion/consent exist).
- Production HTTPS, cookie `Secure`, and backups are designed; Free Render persistence and live email remain blockers.

## Corrected on 21 October 2026

### K1 — Onboarding step copy

- Severity: low.
- The header counted eight stages and six step bodies said "Step N of 6".
- Correction: `onboardingSteps.ts` is the only sequence. The header and steps 2 to 7 read it. Welcome and completion still have no inner "Step N of …" line.
- Retest: the onboarding unit test passed, and the browser walk shows "N of 8" with no "of 6".

### Outfit save sent demonstration wardrobe ids

- Severity: high. A signed-in customer could not save an outfit.
- Outfit Studio started with sample ids such as `w-top-1`. Those ids are not in the signed-in wardrobe, and the save request returned 404, "That wardrobe item was not found."
- Correction: a slot is included only when its id is one of the signed-in wardrobe items. The same filter is used for try-on from the studio.
- Retest: the wardrobe browser test saves "QA office outfit", renames it, and later deletes it.

### Stylist header overflow at 320px

- Severity: medium.
- The stylist header was 52px wider than a 320px viewport.
- Correction: the title block can shrink, the calibration line truncates, and the "Personal Stylist" badge is hidden below the `sm` breakpoint.
- Retest: the visual overflow measurement is 0 at 320px on the stylist.

### Shop row overflow at 320px

- Severity: medium.
- The catalogue and wishlist row was 46px wider than a 320px viewport.
- Correction: that row wraps, and the category scroller cannot expand the page.
- Retest: the shop measurement is 0 at 320px.

### Stylist card claimed stock

- Severity: medium.
- The local greeting card said "In Stock" and showed an estimated rand total for named retailers.
- Correction: the card and its try-on dialog say "Demonstration" and "Demo est." or "Demo R".
- Retest: the stylist browser test expects an "In Stock" count of 0 and a visible "Demo est. R". The style-match percentage is still shown.

### Controls without an accessible name

- Severity: low.
- The product-detail close control had no accessible name, so a test could not activate it. The wardrobe add control said only "Add" below the `sm` breakpoint.
- Correction: the names are "Close product details" and "Add Clothing Piece".
- Retest: the shop test closes the detail, and the wardrobe test opens the add dialog.

### Profile name and shop headings

- Severity: serious on the axe rule, low as a layout defect.
- The profile button's accessible name omitted the visible initial. Shop headings skipped a level.
- Correction: the button name is computed from its visible text plus "Open profile". The category title is an `h2` and the product title is an `h3`, with the same size classes.
- Retest: the follow-up axe scan no longer reports `label-content-name-mismatch` or `heading-order` on registration, home, or shop.

### Try-on simulation copy

- Severity: low.
- Simulate Fit used to alert that a neural fitting simulation would run.
- Correction: the alert says real generation is not active and that the button does not create or send a photograph.
- The button was not clicked. It appears only after a photograph is already active.

## Open after 21 October 2026

### K2 — Refresh does not restore the current section

- Severity: medium for deep links. It is not data loss.
- Unchanged. A reload returns to Home, or to onboarding when that flow is unfinished. A URL router was not added.

### K3 — Large client download

- Severity: low for local testing.
- The JavaScript chunk is now 910.21 kB, gzip 217.76 kB. It was 909.60 kB. It was not split. Editorial JPEGs remain about 605 kB to 989 kB.

### K5 — Gold text contrast

- Severity: serious in the axe scan. It was not changed, because the colour is the editorial palette.
- Registration has 1 contrast node, home has 16, and shop has 35. Examples include `#B49361` and `#9C6A61` on cream. This is not a WCAG conformance result. Recoloring needs a design decision.
- Corrected later the same day for registration, Home, and Shop. See the section below. Other screens were not scanned.

### K6 — Beauty and family prices can still read as offers

- Severity: medium.
- Beauty cards show "Products total" in rand. Family planning shows occasion budgets. Those figures are local demonstration content. They were not relabelled in this pass, to avoid a catalogue rewrite. Shop and the stylist suggestion card now use explicit demo wording.
- Beauty totals were relabelled later the same day. Family occasion budgets are still planning figures.

### K7 — No dedicated reschedule control

- Severity: low. The journey step is blocked, not broken.
- Event Planner can remove a scheduled outfit and create another date. It has no reschedule button. One was not invented.

### K8 — Style-match percentage on a demonstration card

- Severity: low.
- The greeting card still shows a percentage such as "99% Style Match" beside the demonstration label.
- Corrected later the same day. The badge now says "Demonstration suggestion".

## Corrected later on 21 October 2026

### K5 — Gold text contrast on the scanned screens

- Severity: serious in the earlier axe scan.
- `#B49361` on `#F6F2EC` is 2.58:1. `#9C6A61` on the same cream is 4.05:1. Small text needs 4.5:1.
- Correction: light-background text on registration, Home, and Shop uses `#866a40` and `#91635a`. The blush chip uses `#6b433e`. Gold text on the dark membership card stays `#B49361`.
- Retest: axe reports no violations on registration, Home, or Shop. Other screens were not scanned.

### K6 — Beauty demonstration prices

- Severity: medium.
- Beauty totals now say "Demonstration estimate" and "Demo R". Family occasion budgets were not relabelled. They are planning figures chosen in the form, not retailer prices.

### K8 — Style-match percentage

- Severity: low.
- The greeting percentage was a fixed number in the local catalogue, not a measured score.
- The badge now says "Demonstration suggestion". The try-on dialog says "Demonstration preview" instead of a fit percentage.

### K4 — Browser coverage

- The journeys listed as PASS on 21 October in `CUSTOMER_JOURNEY_TEST_MATRIX.md` were executed. These remain NOT RUN: going back to check an onboarding answer, a stylist session-expiry message, Simulate Fit while a photograph is active, clicking a membership Select button, and the browser request that links a real saved beauty look to another account's outfit. The last case is covered by the API beauty test. Keyboard order and touch-target size were not measured. Screenshots were not taken at 320, 390, 768, or 1024.

## Master QA — 22 October 2026

See `BUG_REGISTER.md`, `MASTER_QA_REPORT.md`, and `COMPLETE_FUNCTIONAL_TEST_MATRIX.md`.

### Corrected

- **MQ-001** (high): Stylist heart/save claimed a wardrobe write; now labelled screen-only.
- **MQ-002** (high): Account Settings password change blocked in account mode; demo path labelled.
- **MQ-003** (medium): Notification toggles labelled as browser-only in account mode.
- **MQ-004** (medium): Premature wardrobe outfit “Saving…” success toast removed.
- **MQ-005** (high): Expired media cleanup clears profile photograph slot references (+ regression test).
- **MQ-006** (medium): Media path containment uses directory separator boundary.

### Still open

- K2 (partial restore), K3 (bundle/images), K4 residual NOT TESTED rows, K6 family budget wording.
- **MQ-007** / **MQ-008**: Account Settings contact fields and Beauty bag remain demonstration surfaces (labelled).
- **MQ-018**: Profile Manage Photos has no upload control; onboarding Step 7 remains the account photo path.
- Commercial blockers unchanged (live email/AI/retail/payments/legal/Free Render disk).

### Corrected in Master QA audit follow-up (same day)

- **MQ-009–017**: Customer media cleanup scoped to owner; retention preview account-scoped; media upload requires `private_photo_storage` consent; auth rate limit uses `req.ip`; credit refund restores allocation remaining; stylist rolls back user message on provider failure; Discover Share writes clipboard; header credits use server test balance when signed in; duplicate creates return HTTP 200.
