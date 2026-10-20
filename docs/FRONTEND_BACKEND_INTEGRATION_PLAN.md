# Frontend and backend integration plan

Date: 20 October 2026. Account registration, login, onboarding, style-profile edits, the signed-in stylist, and the signed-in wardrobe now use `server/api` through the Vite `/api` proxy. Shop, try-on, beauty, family, and membership screens still use their existing browser data. Demonstration wardrobe data is not imported.

## Current state

Signed-in style profiles are stored in SQLite. The labelled demonstration still reads `mystyle_ai_user_profile_v1`. The Try On button still ends in the existing alert. The Shop screen still shows the 32 demonstration products. Family still seeds demonstration profiles in the browser. The API, the FASHN lab, and the shopping lab remain separate localhost processes.

An empty `API_ALLOWED_ORIGINS` allows only `localhost` and `127.0.0.1` on ports 3000, 3001, and 4173.

## Connected in this phase

`src/services/accountApi.ts` sends the session cookie and CSRF header. A new account starts from an empty profile. The name Nandi is not written unless the customer chooses to import that browser profile. Wardrobe, family, and photographs are not uploaded automatically.

## Consent-based style import

If `mystyle_ai_user_profile_v1` exists, the customer can continue without importing it or choose style details, sizes, colours, and shopping preferences. Measurements stay off until that box is ticked. The keys in `NEVER_IMPORT_KEYS` are never sent. Wardrobe and adult photographs are not part of this import. The choice is remembered in `sessionStorage` for that user id only, and that value is not treated as authentication.

## Boundaries that stay separate

- Stylist calls stay in the browser keyword matcher until a later AI phase.
- Try-on stays in `server/tryon-lab` until a generation is approved and the consumer button is deliberately connected.
- Shopping stays in `server/shopping` until a retailer feed is licensed.
- Membership and credits stay simulated in the browser. The API will not accept those demonstration balances.
