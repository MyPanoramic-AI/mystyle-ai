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

### K2 — Refresh does not restore the current section

- Severity: medium for deep links. It is not data loss.
- Tabs are component state. A reload returns to Home, or to onboarding if that flow is unfinished. The session cookie still restores the account, and saved records are visible after the section is opened again.
- A URL router was not introduced. That would be a navigation change beyond a targeted defect fix.

### K3 — Large client download

- Severity: low for local testing. It matters before a public launch.
- The production JavaScript chunk is 909.60 kB, and individual editorial JPEGs are about 605 kB to 989 kB.
- The bundle was not split and the images were not recompressed.

### K4 — Browser coverage is incomplete

- Severity: high as an acceptance gap, not as a broken feature that was observed.
- Discover, profile editing, outfit building and scheduling, wardrobe deletion, makeup and nail saves, beauty deletion, outfit links, membership, consent refusal, session expiry, a stopped API, duplicate registration, and a wrong password were not clicked.
- Visual layout at the six widths was not inspected. The end-to-end acceptance gate stays open until those steps are executed or explicitly waived.

## Commercial gaps already known

These are not new defects from this run. They remain launch blockers and are listed in `RELEASE_READINESS.md`.

- Live OpenAI and Gemini quality are untested. Live calls stay disabled.
- Live FASHN quality is untested. No photograph was sent.
- There is no verified retailer feed. Shop copy identifies demonstration data.
- Account recovery and email verification are not implemented.
- Personal photograph onboarding is not part of the connected save path exercised here.
- POPIA and privacy documentation, image licensing, subscription billing, account export, and retention are incomplete.
- Production HTTPS, cookie `Secure`, backups, and a public security review are still required.
