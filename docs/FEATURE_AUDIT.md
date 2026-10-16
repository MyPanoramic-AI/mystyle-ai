# Feature Audit

Audit date: 16 October 2026.

Classifications used here:

- **REAL FRONTEND FUNCTIONALITY** — the screen works in the browser against local state or `localStorage`, without pretending an external system succeeded.
- **SIMULATED FUNCTIONALITY** — the screen is interactive, and the business result is scripted or locally invented.
- **PARTIALLY IMPLEMENTED** — a real local workflow exists beside a scripted or missing core capability.
- **NOT IMPLEMENTED** — no working path for that capability.
- **BROKEN** — a path that was expected to run and failed verification.

No feature is marked production-complete. Browser automation was not available, so navigation was verified by reading `App.tsx` and the screen components. The production bundle was served and its HTML, CSS, and JavaScript returned HTTP 200. Individual clicks were not executed in a visual browser. That limit is stated again in `BUILD_AND_TEST_REPORT.md`.

## Summary

| Feature | Classification | Persists | Backend | Mock data |
| --- | --- | --- | --- | --- |
| Home | REAL FRONTEND FUNCTIONALITY | Reads the stored profile | No | Inspirations, occasions, and hero copy are static |
| Onboarding | REAL FRONTEND FUNCTIONALITY | Profile only | No | Default profile is pre-completed |
| My Profile | REAL FRONTEND FUNCTIONALITY | Yes, profile fields | No | Starts from demonstration profile |
| My Stylist | SIMULATED FUNCTIONALITY | Chat is not stored | No | Keyword catalogue in `stylistKnowledge.ts` |
| Discover | REAL FRONTEND FUNCTIONALITY | Saved looks only | No | Looks and collections are static |
| Virtual Try-On | PARTIALLY IMPLEMENTED | Photos are memory-only | No | "Simulate Fit" is an `alert` |
| Shop | SIMULATED FUNCTIONALITY | Saved products only | No | 32 demonstration listings and prices |
| Family Styling | PARTIALLY IMPLEMENTED | Members and plans | No | Seeded family, including children; outfit ideas are scripted |
| Beauty Studio | SIMULATED FUNCTIONALITY | Saved looks and bag | No | Curated beauty dataset; no generated preview |
| Digital Wardrobe | PARTIALLY IMPLEMENTED | Items, outfits, events | No | Seeded wardrobe; gaps and capsules are static |
| Memberships and credits | SIMULATED FUNCTIONALITY | Local ledger | No | Fixed ZAR plans and instant credit changes |
| Account settings | SIMULATED FUNCTIONALITY | Contact fields locally | No | Password, 2FA, Google, and WhatsApp controls do not authenticate |

Nothing in this table is **BROKEN** in the sense of a failed build or a crash found by static review. Several controls are misleading because they report success for actions that have no external effect. Those are recorded as simulated, not as build failures.

## Home

Implementation exists in `HomeScreen.tsx` and the `src/components/home/` sections. It greets the stored first name, shows editorial imagery, occasion shortcuts, and entry cards for stylist, try-on, shop, family, wardrobe, beauty, and membership.

Functional as a local dashboard. Inspiration content comes from `mockData.ts` and bundled images. Navigation handlers in `App.tsx` clear the subpage and set the destination tab or subpage. No backend.

Production needs authenticated profile data, real recommendation slots, and honest empty states when a customer has not finished onboarding.

## Onboarding

`OnboardingFlow.tsx` walks through welcome, personal details, sizes, style, colours, shopping preferences, photographs, and completion. Photograph step uses `URL.createObjectURL` and tells the user the photos stay in temporary browser memory.

The flow is real frontend behaviour. It does not run on first visit, because `DEFAULT_USER_PROFILE.isOnboardingCompleted` is `true`. Completing onboarding calls `profileService.saveProfile`. Photographs stay in React state only.

Production needs a real first-run gate, server-side profile storage, consent records, and private photo storage. Body measurements must not remain in unencrypted `localStorage`.

## My Profile

`ProfileDashboard.tsx` edits the stored profile and links to saved looks, family, wardrobe, beauty, and membership. Completeness is calculated locally by `profileService.calculateCompleteness`.

Functional against `localStorage`. The starting record is the demonstration profile (Cape Town, ZAR, preset sizes and retailers). Restarting onboarding is wired.

`ProfilePlaceholder.tsx` is an older screen and is not mounted by `App.tsx`.

Production needs the authenticated customer record, field-level validation, and removal of the demonstration identity.

## My Stylist

`StylistChatScreen.tsx` is a working chat layout. Sending a message waits about 600 ms and then calls `generateStylistResponse` in `stylistKnowledge.ts`. That function matches keywords such as wedding, office, weekend, gala, holiday, budget, and beauty, and returns a prepared outfit card or beauty tip. There is no model request.

Voice input in `StylistInputBar.tsx` is commented as simulated dictation. Try-on from a chat card opens `TryOnPreviewModal.tsx`, which does not generate an image.

Chat history is not persisted. Profile fields are interpolated into the scripted copy.

`StylistPlaceholder.tsx` is not mounted.

Production needs the AI coordinator in `AI_INTEGRATION_PLAN.md`, stored conversations, credit checks, and a ban on invented retailer offers. The current cards name retailers and rand amounts that were authored in the catalogue, not verified.

## Discover

`DiscoverScreen.tsx` browses `discoverData.ts`, opens outfit detail, saves looks through `savedLooksService`, and can send a look to Try On, the stylist, or Shop.

The browsing and save/unsave behaviour is real frontend functionality over a static dataset. "Try this look" only preloads the try-on screen. It does not create a fitted image.

Production needs a managed content catalogue or a clear separation between editorial content and shoppable products, plus real try-on and real similar-product search.

## Virtual Try-On

`TryOnPlaceholder.tsx` is the live Try On tab despite the filename. It can show a garment or look passed from Shop, Discover, Family, or Wardrobe, and it can show a session photo if onboarding put one in memory.

The fitting action is an `alert` that says neural fitting will arrive in a later phase. No image is generated. No processing time or cost is recorded. No provider is called.

Classification: **PARTIALLY IMPLEMENTED** user interface, **NOT IMPLEMENTED** try-on generation.

The screen can be opened for a family member name. The proof of concept must not send a child's photograph to a provider. See `VIRTUAL_TRYON_FEASIBILITY.md` and `POC_SCOPE.md`.

## Shop

`ShopScreen.tsx` filters and sorts `shopData.ts` (32 products). Prices are fields named `demoPriceZar`. Product and comparison modals describe the prices as simulated. The footer states that Woolworths, Superbalist, Zara, Bash, H&M, Cotton On, Mr Price, and Takealot listings on this screen are demonstration mockups.

Search, category filters, sort, save, and hand-off to Try On are real frontend behaviour over that mock catalogue. There is no retailer request, no product URL verification, and no live stock check. `ProductDetailModal.tsx` says purchase flows are not simulated.

`ShopPlaceholder.tsx` is not the mounted shop screen. Its `ShopPreloadedContext` type is still imported by `App.tsx` and `ShopScreen.tsx`.

Production needs the licensed-data approach in `SA_RETAILER_INTEGRATION_PLAN.md`. The UI must not present a demonstration price as a current advertised price.

## Family Styling

`FamilyStylingScreen.tsx` supports member cards, a planner, a shopping list, and saved plans. `familyService` provides create, update, and delete against `localStorage`.

On first load the service stores demonstration profiles for an adult partner and two children (ages written as "8 Years" and "12 Years"), including sizes and colour preferences. The UI says child details stay on the device and are never uploaded. That statement is true for the current prototype only because there is no upload path. Storage is persistent `localStorage`, not a single browser session, and it is unencrypted.

Outfit concepts, palette coordination, and shopping totals are built from `familyData.ts` and local estimates. They are not AI generations and not retailer offers.

Classification: **PARTIALLY IMPLEMENTED**. Member CRUD is real local functionality. Styling intelligence is simulated. Child-photo processing is **NOT IMPLEMENTED**, and it must stay that way for the proof of concept.

## Beauty Studio

`BeautyStudioScreen.tsx` browses hairstyles, hair colours, makeup, nails, and complete looks from `beautyData.ts`. Users can save looks and collect products in a local bag, then send product names to Shop or a prompt to the stylist.

There is no hairstyle transfer, makeup render, or nail preview model. Images are the bundled beauty photographs.

Classification: **SIMULATED FUNCTIONALITY** for beauty intelligence, with real local save and bag behaviour.

## Digital Wardrobe

`WardrobeScreen.tsx` lists items, opens an add-item modal, builds outfits, plans events, and shows gaps and capsules.

Items, outfits, and events persist in `localStorage`, after a first-run copy of the demonstration wardrobe. Add-item can store a name, brand, and an image URL or a preset demonstration photo. Gaps (`getWardrobeGaps`) and capsules return `DEMO_WARDROBE_GAPS` and `DEMO_CAPSULES` regardless of the user's items.

Sending an outfit to Try On preloads the first item image. It does not render the outfit on a person.

Classification: **PARTIALLY IMPLEMENTED**.

## Memberships, credits, and account settings

`MembershipHubScreen.tsx` includes:

1. My Membership
2. Explore Plans
3. AI Credits
4. Credit history
5. Account settings
6. Privacy and data
7. Notification preferences

Changing a plan writes `mystyle_membership`, adjusts the local credit balance, and appends a ledger row. No card is charged. Renewal text is a fixed string (`1 November 2026` in `updateSubscriptionPlan`). Credit top-ups add credits immediately in the browser.

`MyMembershipView.tsx` discloses that billing updates are simulated in local browser memory.

Account settings persist the demonstration contact record, including an email and a South African mobile number that ship in source code as prototype data. "Update Password" sets a success message and does not check or store a password. Two-factor, biometric login, Google, Apple, and WhatsApp toggles are local booleans. `twoFactorEnabled` and `biometricLoginEnabled` default to `true` even though no authenticator exists.

Privacy toggles persist, and they do not control a server. `exportUserDataAsJson` downloads membership, credits, transactions, account, privacy, and notification objects. It does not include the style profile, measurements, wardrobe, family members, or saved looks. `resetAllDemoData` removes only the six membership keys. The reset copy says wardrobe pieces and the profile return to defaults. That copy does not match the function. Profile, family, wardrobe, beauty, and saved-item keys remain.

Notification preferences are stored locally. No push, email, or WhatsApp message is sent.

Classification: **SIMULATED FUNCTIONALITY**, with working local forms.

## Cross-module behaviour

Shared customer context is the `UserProfile` object in `App.tsx`, loaded once from `profileService`. Stylist, shop, discover, and profile read that object. Family and wardrobe keep their own storage and do not automatically revise the main profile.

This is the main integration risk: later APIs must replace these stores together, or the screens will disagree about who the customer is. A backend profile must become the source of truth, with the current services turned into API clients rather than a second copy of the rules.

## Production requirements that apply to every module

- Authenticated adult account.
- Server-owned records instead of `localStorage` for personal information.
- Explicit demo labelling until a module is backed by a verified source.
- No child-photo processing in the proof of concept.
- Structured responses so the stylist cannot invent a price, a stock state, or a product URL.
