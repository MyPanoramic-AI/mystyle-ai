# Wardrobe integration

Date: 20 October 2026. Signed-in customers use SQLite. Demonstration mode still uses the labelled browser samples. The two are not merged.

## What a signed-in customer can do

- Add, edit, and delete wardrobe items. Deletion asks for confirmation.
- Attach an optional JPEG, PNG, or WebP photograph through the existing private media store, or keep a normal image URL. `data:` URLs are rejected.
- Build an outfit from owned items, name it, set an occasion, save it, rename it, and delete it.
- Save a Discover inspiration once. Saving it again returns the same record.
- Schedule an outfit for a date or occasion, change the assignment, and remove the plan.
- Sign out and sign in again. The wardrobe, outfits, and plans are loaded from the account.

Demonstration wardrobe, family, and credit records are not uploaded. Account screens do not read the demonstration wardrobe keys.

## Ownership

Every wardrobe item, saved look, and outfit plan is stored with `user_id`. Reads and writes include that id. Another account receives 404. Deleting an item removes it from outfit membership rows. The outfit remains, and the screen says a piece is no longer in the wardrobe. Deleting an outfit clears that outfit from plans instead of leaving a live reference.

Private photographs use `media_assets` with purpose `wardrobe`. Retrieval checks the owner. Files stay under the private media directory and are not served as public static files. They are not sent to OpenAI or FASHN.

## Records

Migration `005_wardrobe_planner.sql` adds garment details to `wardrobe_items`, look kind and outfit fields to `saved_looks`, and the `outfit_plans` table.

Look kinds:

- `wardrobe_outfit`: the customer's own combination.
- `inspiration`: a Discover look id in `source_key`.
- `concept`: reserved for a stylist recommendation id. The stylist does not save these yet.

`saved_products` remains a retailer source and external id only. No price or stock is stored.

## Future stylist use

`authorisedWardrobe` in `server/api/src/domain/wardrobeContext.ts` returns owned item id, name, category, colour, seasons, and occasions. It does not include photographs. The stylist wardrobe specialist still returns `not_connected`. Gap and capsule panels stay labelled as demonstrations.

## Limits

Browser click-through was not available. Outfit harmony text is still the existing screen copy, not a model. Location and weather on a plan are whatever the customer typed in the existing form. Nothing reads a calendar or infers a place. Notifications are not sent.
