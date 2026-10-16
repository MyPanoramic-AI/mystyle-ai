# Customer account integration

Date: 16 October 2026.

## How to run it

Start the API with `npm run api`. It listens on `127.0.0.1:4331`. Start the React app with `npm run dev` and open `http://127.0.0.1:3000` or `http://localhost:3000`. Vite proxies `/api` to the API, so the session cookie is for the page origin. CSRF stays enabled.

If the API is not running, the app explains that and offers a labelled demonstration. That demonstration uses the existing browser profile and does not claim an account was created.

## Flow

1. The app calls `GET /api/health` and `GET /api/auth/session`.
2. A 401 shows registration and login. The session token is not stored in `localStorage`.
3. Registration and login use the existing API. The CSRF token from the response is kept in memory.
4. The app then loads `/api/profile` and `/api/preferences`.
5. A pending profile opens the existing onboarding flow. Skipping marks it `deferred`. Finishing marks it `completed` only after the server accepts the save.
6. Profile edits use `PUT /api/profile` and show a saved message only after that response.
7. Logout calls `POST /api/auth/logout`, drops the in-memory account, and returns to the sign-in screen. The SQLite profile remains.
8. A later 401 returns the customer to sign-in. Refreshing with an expired cookie does the same.
9. Switching accounts replaces the profile object. The previous name and measurements are not merged in.

## Demonstration

The demonstration banner is shown while that mode is active. Leaving it checks the server session again. Family, shop, wardrobe, beauty, try-on, and membership screens are unchanged.

## Photographs

Onboarding photographs stay in temporary browser memory. The existing privacy note still says they are not uploaded. This phase does not upload them, because the screen has three slots and the API stores one private image without a slot. Connecting that safely needs a slot record, consent, and owner-only retrieval. It was not added here. Photographs are not sent to FASHN.
