# Beauty Studio integration

Signed-in Beauty Studio saves preferences and inspiration looks through `server/api`. Demonstration mode still uses `src/services/beautyService.ts`. Those browser records, including the sample saved looks and shopping bag, are not posted to the API.

The catalogue on screen remains editorial inspiration. A saved row is the customer's selection. It is not a photograph of the customer and it is not a verified shop listing.

## Preferences

`GET /api/beauty-preferences` and `PUT /api/beauty-preferences` store optional hairstyle, hair-colour, makeup, nail-style, nail-colour, interest, and occasion lists, plus an optional planned budget range in integer cents. Nothing is required. The API refuses photographs and health fields.

Saving an inspiration card also adds that style label to the matching preference list. The studio then sorts matching cards first. That order is a saved-preference sort, not a live model.

## Saved looks

`beauty_looks` stores the category, title, description, style, colour, occasion, optional planned budget in cents, source label, source key, an editorial `https` image address, notes, and up to four parts. Categories are `hairstyles`, `hair-colours`, `makeup`, `nails`, and `complete-looks`.

A second save with the same source key for the same account returns 409. There is no import route.

`GET /api/beauty-looks` accepts `category` and `q`. `GET`, `PATCH`, and `DELETE /api/beauty-looks/:id` are owner-only.

A complete look stores hairstyle, hair colour, makeup, and nail titles in `parts_json`. The screen can compose one from the existing inspiration lists. The result is a structured selection.

## Outfit links

`POST /api/beauty-looks/:id/links` accepts `outfitId` from `saved_looks` or `planId` from `outfit_plans`. Both must belong to the same account. Another account's id returns 404. `DELETE /api/beauty-looks/:id/links/:linkId` removes the link.

Writes require the session cookie and the CSRF header.

## What the screen does

For a signed-in customer, Beauty Studio loads looks from the API, confirms a save only after the server responds, and clears that state when the account changes because the app remounts. The profile page does not read the demonstration beauty key while signed in.

The shopping bag in account mode stays in memory for the visit and is labelled as a demonstration list. Its prices are not stored as purchases.
