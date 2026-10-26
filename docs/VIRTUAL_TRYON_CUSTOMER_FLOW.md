# Customer virtual try-on flow

Date: 26 October 2026.

## Journey

1. Signed-in adult selects clothing from **Digital Wardrobe / saved garments** (preferred), **Shop** (Try It On preload; demonstration catalogue labelling), or **upload**.
2. Photograph step uses privately stored `full_body_front` when present; otherwise prompts Manage Photos.
3. **Confirm (pre-generation only):** labelled “Your selected photo” + “Selected garment” as inputs — not a finished result. Precise blockers when consent / credits / entitlement / live mode are missing.
4. **Progress:** loading + provider status; no catalogue image presented as output.
5. Generate:
   - **Live** (`generationMode: live`): `fashn-tryon-v1.6` with consent, entitlement, credits, budget, and key.
   - **Local mock** (`local_mock`): clearly labelled “Demonstration output — not a real virtual try-on.”
   - **Unavailable / blocked:** precise CTA; no fake result image.
6. **Result:** Before = customer photo; After = `mediaDisplayUrl(job.resultMediaId)` only (never shop/garment preview). Provider jobs use `resultKind: provider`.
7. **My Virtual Fittings** lists saved successes; delete removes the job and private result media.

## Endpoints

`/api/tryon/availability`, `/garments`, `/prepare`, `/jobs`, `/fittings`, job cancel/delete.

## Live prerequisites

Documented in `FASHN_PROVIDER_CONFIGURATION.md` and `VIRTUAL_TRYON_PRODUCTION_INTEGRATION.md`. Production/Render require `TRYON_ALLOW_LIVE=true` plus `TRYON_LIVE_APPROVAL_ACK=i-approve-paid-fashn-tryon`, a provider key, budget, customer `ai.image` entitlement, credits, and `external_photo_ai` consent.
