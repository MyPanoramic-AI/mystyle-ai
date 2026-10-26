# Virtual Try-On production integration

Date: 26 October 2026.

## Status

Customer-facing Virtual Try-On is implemented on the account API and Try-On UI. **Live FASHN remains disabled by default.** Staging/production refuse `TRYON_ALLOW_LIVE=true` at startup. No unrestricted provider access and no production deploy are authorised by this document.

## Customer journey

1. **Select clothing** — Wardrobe / saved garment (default), Shop demonstration listing (preselect via Try It On), or manual upload.
2. **Photograph** — Prefer privately stored `full_body_front`; allow alternate saved slots; send customers to Manage Photos when missing.
3. **Confirm** — Shows garment + photo, category, estimated internal credits, consent, and generate control.
4. **Generate** — Live path uses `fashn-tryon-v1.6` when readiness checks pass; local development/test may offer a clearly labelled mock that does **not** call FASHN.
5. **Result** — Before/after comparison; provider vs demonstration labels; private persistence.
6. **My Virtual Fittings** — List, reopen, delete; survives refresh/sign-in; cleaned on account deletion.

## Generation modes

| Mode | When | Behaviour |
| --- | --- | --- |
| `live` | `TRYON_ALLOW_LIVE`, key, budget, `external_photo_ai`, `ai.image`, credits | Real FASHN job |
| `local_mock` | Development/test (or `TRYON_ALLOW_CUSTOMER_MOCK=true`) with storage consent | Labelled local demo only |
| `unavailable` | Otherwise | Honest unavailable copy; no fake success |

## APIs

- `GET /api/tryon/availability`
- `GET /api/tryon/garments`
- `POST /api/tryon/prepare`
- `GET|POST /api/tryon/jobs`, `GET /api/tryon/jobs/:id`, `POST .../cancel`, `DELETE .../:id`
- `GET /api/tryon/fittings`

## Controlled live activation

See `docs/FASHN_PROVIDER_CONFIGURATION.md`. Requires explicit owner approval, non-production environment (or approved override), key, nonzero budget, consent, entitlement, and credits. Do not enable on public Render without a separate production gate change.
