# Customer virtual try-on flow

Date: 26 October 2026.

## Placeholder removed

`TryOnPlaceholder` previously only called `showStatus('Simulate Fit acknowledged…')` and never contacted the account API. That placeholder status path is replaced by a real job workflow against `/api/tryon/*`.

## How the workflow operates

1. Signed-in adult customer selects a privately stored photograph (`full_body_front`, additional angle, or portrait).
2. Customer selects garment category and an authorised garment image (upload or Shop preload).
3. **Simulate Fit** creates `POST /api/tryon/jobs` with `providerId: 'mock'` by default.
4. The API validates ownership, image bytes, and idempotency, then runs the local demonstration provider asynchronously.
5. The UI polls `GET /api/tryon/jobs/:id` for queued → running → succeeded/failed/cancelled.
6. Successful mock results are stored as `tryon_result` media and labelled **Demonstration output — not a real virtual try-on.**
7. Mock generation does **not** reserve or consume membership credits.
8. Live providers `fashn-tryon-v1.6` and `fashn-tryon-max` reuse `server/tryon-lab` adapters. They require:
   - `TRYON_ALLOW_LIVE=true`
   - `TRYON_MAX_BUDGET_USD` above estimated cost
   - `FASHN_API_KEY` on the server only
   - granted `external_photo_ai` consent (private storage consent alone is insufficient)
   - credit reservation against `ai.image` before the provider call

Production/staging refuse `TRYON_ALLOW_LIVE=true` until a separate approval override path is added (same posture as `AI_ALLOW_LIVE`).

## What remains disabled

- Live FASHN transmission (default)
- Billing / purchased credit spend for try-on (mock spends nothing)
- Browser exposure of API keys

## Activating the first authorised live FASHN test

1. Explicit product approval to spend FASHN credits and transmit adult test images.
2. Set server env only (never Vite): `TRYON_ALLOW_LIVE=true`, `TRYON_MAX_BUDGET_USD` > 0, `FASHN_API_KEY`, optional `TRYON_PROVIDER_TIMEOUT_MS`.
3. For staging/production, also change the production safety gate to allow the approved live try-on override (today it refuses automatically).
4. Grant `external_photo_ai` for the test account.
5. Call `POST /api/tryon/jobs` with `providerId: 'fashn-tryon-v1.6'` using synthetic adult photographs and garment images you have rights to.
6. Confirm cost, latency, retention, and result quality before enabling anything customer-facing.
