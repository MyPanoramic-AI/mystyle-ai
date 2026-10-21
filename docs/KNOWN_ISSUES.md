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
- Tabs are component state. A reload returns to Home, or to onboarding if that flow is unfinished. The session cookie still restores the account, and saved records are visible after the section is opened again.
- A URL router was not introduced. That would be a navigation change beyond a targeted defect fix.

### K3 — Large client download

- Severity: low for local testing. It matters before a public launch.
- The production JavaScript chunk is 909.60 kB, and individual editorial JPEGs are about 605 kB to 989 kB.
- The bundle was not split and the images were not recompressed.
- On 21 October the chunk measured 910.21 kB. It is still one file. See K3 in the later section.

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
- Account recovery and email verification are not implemented.
- Personal photograph onboarding is not part of the connected save path exercised here.
- POPIA and privacy documentation, image licensing, subscription billing, account export, and retention are incomplete.
- Production HTTPS, cookie `Secure`, backups, and a public security review are still required.

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

### K6 — Beauty and family prices can still read as offers

- Severity: medium.
- Beauty cards show "Products total" in rand. Family planning shows occasion budgets. Those figures are local demonstration content. They were not relabelled in this pass, to avoid a catalogue rewrite. Shop and the stylist suggestion card now use explicit demo wording.

### K7 — No dedicated reschedule control

- Severity: low. The journey step is blocked, not broken.
- Event Planner can remove a scheduled outfit and create another date. It has no reschedule button. One was not invented.

### K8 — Style-match percentage on a demonstration card

- Severity: low.
- The greeting card still shows a percentage such as "99% Style Match" beside the demonstration label.

### K4 — Browser coverage

- The journeys listed as PASS on 21 October in `CUSTOMER_JOURNEY_TEST_MATRIX.md` were executed. These remain NOT RUN: going back to check an onboarding answer, a stylist session-expiry message, Simulate Fit while a photograph is active, clicking a membership Select button, and the browser request that links a real saved beauty look to another account's outfit. The last case is covered by the API beauty test. Keyboard order and touch-target size were not measured. Screenshots were not taken at 320, 390, 768, or 1024.
