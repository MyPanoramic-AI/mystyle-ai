# Onboarding private photographs

Date: 22 October 2026.

## Slots

| Slot API key | UI label | Media purpose |
| --- | --- | --- |
| `portrait` | Profile Portrait | `profile_portrait` |
| `full_body_front` | Full-Body Front Pose | `full_body_front` |
| `full_body_additional` | Side or 45° Angle | `full_body_additional` |

Media bytes use the existing `media_assets` store. Profile columns `portrait_media_id`, `full_body_front_media_id`, and `full_body_additional_media_id` hold owner-scoped references (migration `011_profile_photo_slots.sql`).

## Consent

| Purpose | Meaning |
| --- | --- |
| `private_photo_storage` | Store adult photographs privately inside MyStyle AI |
| `external_photo_ai` | Separate optional consent for future external image processors |

Granting private storage never authorises FASHN, OpenAI, or Gemini. Uploads require `private_photo_storage`. Child / minor purposes are refused.

## API

- `GET /api/profile/photos`
- `PUT /api/profile/photos/:slot` (base64 JPEG/PNG/WebP, CSRF)
- `DELETE /api/profile/photos/:slot`
- `GET /api/media/:id` owner-only retrieval

Replacement deletes the previous media object. Account deletion and privacy media delete clear slot references. Export includes media in the private archive manifest.

## Client

Signed-in onboarding Step 7 uploads after an explicit consent checkbox. Display uses `/api/media/:id` with session cookies. Logout clears React photo state; login reloads slots from the profile. Demonstration mode keeps browser-memory previews only.
