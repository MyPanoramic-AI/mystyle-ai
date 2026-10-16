# Frontend and backend integration plan

Date: 16 October 2026. No consumer screen was switched to the API in this phase.

## Current state

The React app still reads and writes `localStorage`. The Try On button still ends in the existing alert. The Shop screen still shows the 32 demonstration products. Family still seeds demonstration profiles in the browser. The API, the FASHN lab, and the shopping lab are three separate localhost processes.

`API_ALLOWED_ORIGINS` is empty, so a browser page on the Vite origin cannot call the API yet.

## Later connection, one module at a time

1. Add the Vite origin to `API_ALLOWED_ORIGINS` only when a signed-in flow is ready to test.
2. Add a small client in `src/services` that sends the cookie and the CSRF header. Do not put the session token in `localStorage`.
3. Keep the current screens. Replace a service function only after the API route for that screen has passed its tests.
4. Show an empty profile for a new account. Do not copy the demonstration profile named Nandi into the server.
5. Do not upload the browser wardrobe, family list, or photographs automatically.

## Consent-based migration, not done

A future migration can offer an adult an explicit export-and-upload step for their own profile, wardrobe, and adult photographs. It must skip `mystyle_family_members_v1` and any record classified as a child. It must not run on first page load. That step is not implemented.

## Boundaries that stay separate

- Stylist calls stay in the browser keyword matcher until a later AI phase.
- Try-on stays in `server/tryon-lab` until a generation is approved and the consumer button is deliberately connected.
- Shopping stays in `server/shopping` until a retailer feed is licensed.
- Membership and credits stay simulated in the browser. The API will not accept those demonstration balances.
