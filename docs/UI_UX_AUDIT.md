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
