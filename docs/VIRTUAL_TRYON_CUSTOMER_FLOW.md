# Customer virtual try-on flow

Date: 26 October 2026.

## Placeholder removed

`TryOnPlaceholder` previously only called `showStatus('Simulate Fit acknowledged…')` and never contacted the account API. That placeholder status path is replaced by a real job workflow against `/api/tryon/*`.

## How the workflow operates

1. Signed-in adult customer selects a privately stored photograph (`full_body_front`, additional angle, or portrait).
2. Customer selects a garment from, in preferred order:
   - **Digital Wardrobe** / previously uploaded garment references (`GET /api/tryon/garments`, default when available)
   - **MyStyle AI Shop** demonstration listing (client preload; labelled as demonstration catalogue, not a verified retailer product)
   - **Manual upload** (`garmentImageBase64`)
3. **Simulate Fit** calls `POST /api/tryon/prepare` then `POST /api/tryon/jobs` with `providerId: 'mock'` by default.
4. The API validates ownership, image bytes, and idempotency, then runs the local demonstration provider asynchronously.
5. The UI polls `GET /api/tryon/jobs/:id` for queued → running → succeeded/failed/cancelled.
6. Successful mock results are stored as `tryon_result` media and labelled **Demonstration output — not a real virtual try-on.**
7. Mock generation does **not** reserve or consume membership credits.
8. Live providers `fashn-tryon-v1.6` and `fashn-tryon-max` reuse `server/tryon-lab` adapters. They require:
   - `TRYON_ALLOW_LIVE=true`
   - `TRYON_MAX_BUDGET_USD` above estimated cost
   - `FASHN_API_KEY` on the server only
   - granted `external_photo_ai` consent (private storage consent alone is insufficient)
   - an active entitlement that includes `ai.image` (not FREE-only)
   - sufficient membership test credits for reservation against `ai.image`
   - credit reservation before the provider call
   - account authentication and image validation
   - idempotency key (duplicate submissions return the same job)

Production/staging refuse `TRYON_ALLOW_LIVE=true` until a separate approval override path is added (same posture as `AI_ALLOW_LIVE`). Public Render therefore cannot enable live generation via env alone.

## Preparation endpoint

`POST /api/tryon/prepare` validates person/garment inputs and returns readiness blockers, estimated credits, and estimated USD **without** creating a job, reserving credits, or contacting FASHN.

## What remains disabled

- Live FASHN transmission (default)
- Billing / purchased credit spend for try-on (mock spends nothing)
- Browser exposure of API keys
- Live generation on the public Render service

## Activating the first authorised live FASHN test

1. Explicit product approval to spend FASHN credits and transmit adult test images.
2. Safe **non-production** environment only (not public Render).
3. Set server env only (never Vite): `TRYON_ALLOW_LIVE=true`, `TRYON_MAX_BUDGET_USD` > 0, `FASHN_API_KEY`, optional `TRYON_PROVIDER_TIMEOUT_MS`.
4. For staging/production, also change the production safety gate to allow the approved live try-on override (today it refuses automatically).
5. Grant `external_photo_ai` for the test account.
6. Call `POST /api/tryon/prepare` then `POST /api/tryon/jobs` with `providerId: 'fashn-tryon-v1.6'` using synthetic adult photographs and garment images you have rights to.
7. Confirm cost, latency, retention, and result quality before enabling anything customer-facing.

Genuine provider results use `resultKind: 'provider'` and are never labelled with the demonstration striped image.
