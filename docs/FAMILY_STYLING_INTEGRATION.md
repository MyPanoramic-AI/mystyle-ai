# Family styling integration

Signed-in family styling uses `server/api`. Demonstration mode still uses `src/services/familyService.ts` and is labelled in the family screen. The sample profiles, including the child demonstrations, are not posted to the API.

## Profiles

`family_relationships` belongs to `owner_user_id`. A profile stores a display name, relationship label, `adult` or `dependent`, style, colour, occasion, category, and comfort lists, optional size labels, and an optional planned budget in integer cents. It does not store a date of birth or a photograph. `canAuthenticate` is always false.

The account holder can add, view, edit, and delete a profile. Deleting a profile removes that profile from existing event plans and leaves the event in place.

## Events

`family_events` stores the title, date, occasion, formality, style direction, colour theme, planned total in cents, notes, and status (`planned`, `ready`, or `archived`). `family_event_participants` stores each selected profile, or `self` for the account holder, with a planned allocation and an outfit note.

These rows are not `outfit_plans`. A personal outfit plan and a family event stay separate. The screen still builds outfit concepts locally with `generateCoordinatedConcepts`. The saved amounts are planned budgets. The piece figures shown while planning are estimates already in the demonstration generator. They are not retailer prices, stock, or purchases.

If allocations are omitted, the server splits the total in whole cents so the parts add up to the total.

## Endpoints

All of these require a session. `POST`, `PATCH`, and `DELETE` also require the CSRF header.

- `GET /api/family` and `POST /api/family`
- `GET /api/family/:id`, `PATCH /api/family/:id`, and `DELETE /api/family/:id`
- `GET /api/family-events` and `POST /api/family-events`
- `GET /api/family-events/:id`, `PATCH /api/family-events/:id`, and `DELETE /api/family-events/:id`

There is no import route. A wardrobe item id on an event must belong to the same account. Another account's profile or wardrobe item returns 404.

## Future stylist boundary

`server/api/src/domain/familyPlans.ts` exports `familyPlanningBoundary`. It marks external transmission as disabled, excludes dependents and photographs, and is not called by the stylist service. The Ask Stylist button on the family planner sends only adult names, the occasion, and the colour theme. Live model calls remain off.

## Deferred

Invitations, shared logins, delegated editing, child accounts, child photographs, child try-on, and live family recommendations are not part of this phase.
