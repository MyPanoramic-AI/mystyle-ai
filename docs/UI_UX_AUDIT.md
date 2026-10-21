# UI and UX audit

Date: 20 October 2026.

The editorial design was left in place. This audit records measurements and interactions from the browser suite, plus source checks that explain those results. It does not record a visual design review. No screenshot was taken.

## Navigation

The five primary destinations open: Home, My Stylist, Try On, Shop, and My Profile. Digital Wardrobe, Family Styling, and Beauty Studio open from Home cards. Discover, Membership, Saved Looks, and Outfit Planner were not opened.

The application does not put the current tab in the URL. Refresh restores the session and returns to Home, or to onboarding when that flow is still unfinished. Saved wardrobe, beauty, and stylist records are still available after the customer opens those sections again. This is recorded as K2 in `KNOWN_ISSUES.md`. A router was not added.

## Responsiveness

The signed-in home shell was resized in Chrome to 320, 375, 390, 768, 1024, and 1440 pixels wide, at 800 pixels tall. The test fails when `document.documentElement.scrollWidth` is greater than the viewport width.

Before the correction, 768px overflowed. The header row used `md:flex` for the desktop links, so the logo, five links, credits, and avatar were laid out in one row as soon as the width reached 768. The bottom navigation was hidden at the same breakpoint. The overflowing elements were the sticky header and the `max-w-6xl` row with `gap-8`.

The desktop links now use `hidden lg:flex`. The bottom navigation uses `lg:hidden`. Main content keeps `pb-28` until the `lg` breakpoint, so the fixed bottom bar does not cover the last content at 768px. The same six widths then passed.

That result does not prove the absence of clipped text, overlapping cards, or broken images. Those checks were not done on Discover, Wardrobe, Family, Beauty, Shop, Try On, or the stylist conversation, and they were not done inside modals.

## Confirmed presentation defects

D1, medium, is the 768px overflow above. It is fixed and retested.

D2, low, is an empty image `src`. Opening Add Clothing Piece rendered a preview image before any URL existed. Saving a family plan then rendered concept cards whose stored image URL is empty, because the event API stores an outfit note rather than a photograph. Chrome logged that an empty string was passed to `src`. Both renders now skip the image when the URL is empty. The records journey fails if that console warning returns, and the retest passed.

K1, low, remains open. The onboarding header correctly says "N of 8". The body of the personal-details, sizes, style, colour, shopping, and photograph steps still says "Step N of 6". The wording was not changed in this pass because it is a copy correction across six screens and it did not block the journey. It should be corrected before a customer pilot so the step count is consistent.

## Shop and try-on language

Shop still shows the existing paragraph that store names, listings, and prices are illustrative demonstration mockups. The browser test confirmed that paragraph is visible. Filters and product-detail navigation were not clicked.

Try On says: "This is a preview of the fitting room. Real try-on generation is not active, and this page does not create a photograph of you." The older "Neural fitting model simulation" sentence is absent. The upload buttons were not clicked, so their validation copy was not observed.

Beauty Studio shows "Preview generation is not yet available." The stylist shows "Demonstration stylist. This is not a live model."

## Accessibility

The browser tests found controls by accessible name, so these names are present and unique enough for Playwright: Email, Password, Confirm password, Create account, Sign in, I already have an account, Skip to App, Skip, Explore MyStyle AI, Home, My Stylist, Try On, Shop, My Profile, Send message, New Session, Start Fresh Session, Add Clothing Piece, Save Piece to Wardrobe, Add Member, Add to Family, Save Plan, Hairstyles, Save, Look name, Save look, and Sign out.

Invalid email feedback comes from the browser's native email constraint. It does not appear as an in-page `role=alert`. The weak-password message does use `role=alert`.

The profile button has a visible `focus-visible` ring in source. Focus order, contrast ratios, screen-reader announcements for every save, and touch-target dimensions were not measured. Those items stay NOT VERIFIED.

## Performance

`npm run build` on 20 October 2026 produced one JavaScript chunk, `dist/assets/index-CxZ9xtIn.js`, at 909.60 kB, 217.55 kB gzip. Vite still warns that chunks are larger than 500 kB. The root cause is that the client is one bundle: there is no route split, and the tab state lives in `App`. Splitting it would change the loading design, so it was not done in this QA pass.

The same build copies editorial JPEG assets of about 605 kB to 989 kB each. Those images, not the JavaScript warning alone, dominate the first download. They were not recompressed or removed.

An earlier Vite warning about `__dirname` came from the ESM `vite.config.ts` using a CommonJS variable. The config now takes its directory from `fileURLToPath(import.meta.url)`. This build did not print that warning.

Duplicate API calls and frontend memory growth were not profiled. Initial load timing was not measured beyond the build size.

## 21 October 2026

### Screens that were opened

Discover, Saved Looks, Membership, Outfit Studio, and the Event Planner were opened in addition to the screens from 20 October. Primary navigation and the bottom navigation were visible at 375px on the captured screens. Desktop navigation is visible at 1440px. Refresh still returns to Home or to unfinished onboarding. That remains K2. A router was not added.

### Overflow

The visual test measured `scrollWidth` against the viewport at 320, 375, 390, 768, 1024, and 1440 on onboarding, home, profile, stylist, shop, try-on, wardrobe, family, beauty, and membership, plus the wardrobe add dialog at 375. The final measurement was 0 on each.

Before that, the stylist header was 52px wider than a 320px viewport, and the shop catalogue row was 46px wider. The stylist title block can now shrink, the "Personal Stylist" badge is hidden below the `sm` breakpoint, and the calibration line truncates. The shop tabs wrap, and the category scroller is constrained to the page width. Both corrections were included in the passing measurement.

### Screenshots

Full-page screenshots were written to `test-results/visual/`, which is gitignored. Captures exist at 375 and 1440 for onboarding, home, profile, stylist, shop, try-on, wardrobe, family, beauty, and membership, plus a 375 viewport shot of the wardrobe add dialog. Widths 320, 390, 768, and 1024 were measured for overflow and were not captured as images.

What the images showed:

- Onboarding at both widths shows "1 of 8", the welcome card, Let's Get Started, and the skip link. Text is inside the card.
- Profile at 375 stacks the section cards. Edit actions are on the cards. The bottom navigation is visible.
- The stylist at 375 shows the demonstration banner, the consent-off notice, and a suggestion card labelled Demonstration with demo prices. The quick-inquiry chips continue in a horizontal scroller, so the next chip peeks at the right edge. That did not widen the page.
- Wardrobe at 375 shows Add, a horizontal tab scroller, the empty state, and the bottom navigation clear of that empty state. The add dialog shows the title, file control, and fields. The dialog shot is the viewport, so fields below the fold are not in the image.
- Shop, home, family, beauty, and membership at 375 stack their cards. Shop cards keep the Demo Listing label. Beauty cards still show a products total in rand. Membership plan cards show prices. The guarantee sentence is on My Membership, which the membership test opened separately.
- At 1440 the onboarding card is centered, and the stylist header shows Personal Stylist, Explore Inspiration, and New Session.
- Full-page captures paint the sticky header and the fixed bottom navigation over the content that was scrolling underneath them. That repetition is from the capture, not a second copy of the page in the layout. No new overlap defect was confirmed from it.
- The suggestion card's price line is tight beside the garment heading at 375. It remains readable. It was not restyled.
- No broken image icon was identified in the captured screens. Editorial photographs rendered on onboarding, the stylist card, shop, home, family, and beauty.

### Shop, try-on, and stylist language

Shop filters change the result count. Product details say "Demo price". Saved products stay on the wishlist as Demo Listing.

Try On still says generation is not active. Take Photo and Choose from Gallery open a dialog that says the upload waits for Phase 2. Simulate Fit is hidden until a photograph is active, so that button was not clicked. Its alert text, if it is reached later, now says real generation is not active and that the button does not create or send a photograph.

The local stylist greeting card no longer says "In Stock". It says "Demonstration" and "Demo est. R…". It still shows a style-match percentage. That percentage was not removed.

### Accessibility

`@axe-core/playwright` scanned the registration form, the signed-in home screen, and Shop. The scan is not a WCAG conformance claim. Keyboard order, contrast ratios measured by hand, and touch-target pixel sizes were not measured.

After the corrections, the scan reports only `color-contrast`, impact serious: 1 node on registration, 16 on home, and 35 on shop. The examples are gold labels such as `#B49361` and `#9C6A61` on the cream background, including the word "AI", "Demo Listing", and "Demo Mode". Those colours are the existing editorial palette. They were not recolored.

Two other violations were present on the first scan and were corrected:

- The profile button's accessible name did not contain its visible initial and name. The overriding label was removed. The visible initial and name stay in the name, with visually hidden text "Open profile". The image alternative is empty when a photograph is shown, so it does not add a second name.
- Shop skipped from an `h1` to an `h3`, and product titles were `h4`. The category title is now an `h2` and the product title is an `h3`. The classes that set their size were not changed. The follow-up scan no longer reports `heading-order` or `label-content-name-mismatch` on these three pages.

The product-detail close control and the small-screen wardrobe add control now have explicit accessible names.

### Performance

The 21 October production JavaScript chunk is 910.21 kB, gzip 217.76 kB. The 20 October chunk was 909.60 kB, gzip 217.55 kB. No route split was added. There is still one client bundle because navigation is tab state in `App`, not URL routes. Splitting it would change loading. The chunk warning remains. Editorial JPEGs of about 605 kB to 989 kB are still the larger download.

## 21 October 2026 — contrast and demonstration labels

Text that failed on the registration, Home, and Shop screens was darkened without changing page backgrounds. Small gold text uses `#866a40` instead of `#B49361`. Small rose text uses `#91635a` instead of `#9C6A61`. The "Smart Curation" chip, which sits on a blush tint, uses `#6b433e`. Gold on the dark membership card stays `#B49361`, because that pair already clears 4.5:1 and the darker text would not.

Calculated pairs against `#F6F2EC`, the darkest common cream:

| Text | On cream | Result |
| --- | ---: | --- |
| `#B49361` | 2.58:1 | Below AA for small text |
| `#866a40` | 4.54:1 | Meets 4.5:1 |
| `#9C6A61` | 4.05:1 | Below AA for small text |
| `#91635a` | 4.55:1 | Meets 4.5:1 |

`#866a40` on the dark membership background is 3.41:1, so that card was left on `#B49361` (5.99:1). Borders, button fills, and gold dots were not recolored.

The follow-up axe scan of registration, signed-in Home, and Shop reported no violations. Before this pass the same scan reported color-contrast only: 1 node, 16 nodes, and 35 nodes. This is not a WCAG conformance claim. Other screens were not scanned. Keyboard order and touch-target size were not measured.

Beauty "Products total" is now "Demonstration estimate" with a "Demo R" amount. The stylist greeting no longer shows a style-match percentage. The score was a fixed catalogue number, so the badge now says "Demonstration suggestion". Shop, membership, and try-on lines that implied a live price, a saved discount, a completed fitting, or a real payment were rewritten in place.
