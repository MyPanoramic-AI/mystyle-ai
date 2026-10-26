# Customer virtual try-on flow

Date: 26 October 2026.

## Journey

1. Signed-in adult selects clothing from **Digital Wardrobe / saved garments** (preferred), **Shop** (Try It On preload; demonstration catalogue labelling), or **upload**.
2. Photograph step uses privately stored `full_body_front` when present; otherwise prompts Manage Photos.
3. Confirm step shows garment, photograph, category, estimated internal credits, and consent state.
4. Generate:
   - **Live** (`generationMode: live`): `fashn-tryon-v1.6` with consent, entitlement, credits, budget, and key.
   - **Local mock** (`local_mock`): clearly labelled development/test demonstration — never presented as real FASHN.
   - **Unavailable**: honest message that photographs were not sent for AI processing. No striped fake success.
5. Result shows before/after; provider results use `resultKind: provider`.
6. **My Virtual Fittings** lists saved successes; delete removes the job and private result media.

## Endpoints

`/api/tryon/availability`, `/garments`, `/prepare`, `/jobs`, `/fittings`, job cancel/delete.

## Live prerequisites

Documented in `FASHN_PROVIDER_CONFIGURATION.md` and `VIRTUAL_TRYON_PRODUCTION_INTEGRATION.md`. Production/Render refuse `TRYON_ALLOW_LIVE` at startup until a separate override is approved.
