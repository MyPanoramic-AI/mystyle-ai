# Current Architecture

Audit date: 16 October 2026. This describes the code that is present. It is not the target production design.

## Runtime shape

The application is a single-page client.

| Piece | Actual implementation |
| --- | --- |
| Entry | `index.html` loads `/src/main.tsx` |
| Root | `src/main.tsx` renders `src/App.tsx` into `#root` |
| Navigation | React state in `App.tsx`. There is no URL router |
| Primary tabs | `home`, `stylist`, `try-on`, `shop`, `profile` via `AppShell`, `TopHeader`, and `BottomNav` |
| Full-screen sections | `discover`, `family`, `wardrobe`, `beauty`, `membership`, held in `activeSubpage` |
| Onboarding | Replaces the shell while `isOnboardingActive` is true |
| Styling | `src/index.css` with Tailwind CSS 4 `@theme` tokens |
| Design constants | `src/constants/tokens.ts` |
| Persistence | `window.localStorage` inside `src/services/` |
| Backend | Not implemented. `express` and `dotenv` are unused dependencies |
| AI SDK | `@google/genai` is installed and unused |

`metadata.json` declares `MAJOR_CAPABILITY_SERVER_SIDE_GEMINI_API`. No server-side Gemini route exists in this repository.

## How navigation actually works

`App.tsx` owns the active tab, the active subpage, and the objects passed between screens:

- A discover look can open Try On, the stylist, or Shop.
- A shop garment can open Try On as a `PreloadedGarment`.
- Family, wardrobe, and beauty screens can send a prompt to the stylist or a search context to Shop.
- Membership opens from Home and Profile and returns to Profile.

Refreshing the browser returns the user to Home. The in-memory tab, uploaded `blob:` photographs, and cross-screen preload objects are lost. `localStorage` records survive a refresh.

There is no authentication gate. The default profile in `profileService` is already marked `isOnboardingCompleted: true`, with the demonstration first name Nandi. Onboarding runs only when the user starts it from Home or Profile.

## Module map

```
src/
  App.tsx                 Orchestrates tabs, subpages, and cross-screen payloads
  main.tsx                React 19 root
  components/
    layout/               Header, bottom navigation, page shell
    onboarding/           Eight-step flow (welcome through completion)
    pages/                Home and the Try On screen; three unused placeholder screens
    home/                 Home sections
    stylist/              Chat UI
    discover/             Lookbooks and saved looks
    shop/                 Catalogue, filters, comparison, saved products
    family/               Member CRUD and coordinated plans
    beauty/               Beauty catalogue and saved looks
    wardrobe/             Items, outfit builder, events, gaps, capsules
    membership/           Plans, credits, account, privacy, notifications
    profile/              Profile dashboard
    common/               Button, Modal, ImageWithFallback
  services/               localStorage adapters
  data/                   Static demonstration datasets
  types/                  TypeScript contracts
  assets/images/          Photographs imported by the data modules
```

## Service boundaries

These files are the correct seam for a later API. They already isolate the UI from storage details.

| Service | Storage keys | Seed behaviour |
| --- | --- | --- |
| `profileService.ts` | `mystyle_ai_user_profile_v1` | Returns a built-in South African demonstration profile when nothing is stored |
| `familyService.ts` | `mystyle_family_members_v1`, `mystyle_saved_family_plans_v1` | Writes three demonstration members, including two child profiles, the first time it loads in a browser |
| `wardrobeService.ts` | `mystyle_wardrobe_items_v1`, `mystyle_wardrobe_outfits_v1`, `mystyle_wardrobe_events_v1` | Copies demonstration items, outfits, and events into storage on first read |
| `beautyService.ts` | `mystyle_saved_beauty_looks_v1`, `mystyle_beauty_shopping_bag_v1` | Seeds saved looks and a shopping bag from `beautyData.ts` |
| `savedLooksService.ts` | `mystyle_saved_looks_v1` | Empty until the user saves a look |
| `savedProductsService.ts` | `mystyle_saved_products_v1` | Empty until the user saves a product |
| `membershipService.ts` | `mystyle_membership`, `mystyle_credits`, `mystyle_credit_transactions`, `mystyle_account_settings`, `mystyle_privacy_settings`, `mystyle_notification_settings` | Falls back to demonstration plans, credits, transactions, and account fields |

`WardrobeScreen.tsx` also writes `mystyle_wardrobe_outfits_v1` directly. That path bypasses `wardrobeService` and should be folded back into the service before a backend migration.

## Data modules

| File | Role |
| --- | --- |
| `mockData.ts` | Home occasions, inspirations, retailers, sizes, colours, and a second demonstration profile |
| `stylistKnowledge.ts` | Keyword matcher and canned outfit cards. The stylist name in the UI is Aria |
| `shopData.ts` | 32 demonstration products. File header states that prices, stock, and retailer affiliations are mock representations |
| `discoverData.ts` | Editorial looks and collections |
| `beautyData.ts` | Hairstyles, colours, makeup, nails, and complete looks |
| `wardrobeData.ts` | Demonstration garments, mostly Unsplash URLs, plus static gaps and capsules |
| `familyData.ts` | Occasion templates and budget-splitting helpers |
| `membershipData.ts` | Discovery (R0), Signature (R149 per month), Private Atelier (R349 per month), credit packs, and a demonstration ledger |

Shop retailer names in `src/types/shop.ts` are Woolworths, Mr Price, Superbalist, Bash, Cotton On, H&M, Zara, and Takealot. `CURSOR_HANDOVER.md` also names Foschini and Truworths. Those two names are not the shop catalogue type. The shop screen itself tells the user that the listings are illustrative mockups.

## Photographs

- Bundled campaign images are imported from `src/assets/images/` (16 JPEG files).
- `public/images/` repeats those files and adds shorter filenames used only as `|| '/images/...'` fallbacks. Imported JPEG modules are non-empty strings, so those public fallbacks are not on the normal render path.
- Wardrobe and some family imagery hotlink `images.unsplash.com`.
- User fitting photos use `URL.createObjectURL` in `Step7Photographs.tsx` and live in React state (`TemporaryPhotos`). `profileService` documents that photographs must not be written to `localStorage`.

## Dependencies that do not participate in the UI

Declared and installed, with no import under `src/`:

- `express` and `@types/express`
- `dotenv`
- `@google/genai`
- `motion`
- direct `esbuild` (the bundler uses Vite's own pipeline; the direct package existed as a devDependency)
- `tsx`
- `autoprefixer` (Tailwind 4 is wired through the Vite plugin, not a PostCSS config; no `postcss.config` or `tailwind.config` file is present)

`lucide-react` is used throughout the interface.

## Handover statements that do not match the export

`CURSOR_HANDOVER.md` says the stack is React 18 and TypeScript 5, and it mentions `@tailwindcss/typography`. `package.json` depends on React 19, TypeScript 7, and does not depend on the typography plugin. The handover also says Phase 1 was fully verified. This audit found a buildable prototype, not an independently tested product: there is no test script.

The handover's Phase 2 list recommends Firebase or Supabase auth, PostgreSQL, and retailer scrapers. Those choices are not adopted for the controlled proof of concept. See `PROPOSED_BACKEND_ARCHITECTURE.md` and `SA_RETAILER_INTEGRATION_PLAN.md`.

## Structural issues to carry forward

- `App.tsx` is the only integration point for every feature. It works, and it will become difficult to change safely without a router or a smaller navigation coordinator.
- Three early screens are unused by `App`: `StylistPlaceholder.tsx`, `ProfilePlaceholder.tsx`, and the `ShopPlaceholder` component. `ShopPreloadedContext` is still exported from `ShopPlaceholder.tsx` and is used by Shop. `HeroCard.tsx` and `OccasionScroller.tsx` are also unused; Home uses `EditorialHero` and `OccasionCarousel`.
- TypeScript project settings do not set `"strict": true`. An extra `tsc --noEmit --strict` run during this audit still exited 0. That result is recorded in `BUILD_AND_TEST_REPORT.md`. It is not a reason to treat the product as tested.
- The production JavaScript chunk is a single file of about 853 kB minified (about 201 kB gzip). Vite warned that it exceeds 500 kB. Code-splitting is deferred; it would be a structural change, not an audit fix.
- `npm run clean` is `rm -rf dist server.js`. It was not run. On Windows PowerShell, `rm -rf` is not the Unix command the script expects, and the script would delete `server.js` if that file is added later.

## Build toolchain

- Package manager: npm. No lockfile was in the export. `package-lock.json` was created by `npm install` on 16 October 2026.
- Node.js v24.18.0 and npm 11.16.0 were used for verification.
- `npm run lint` is `tsc --noEmit`.
- `npm run build` is `vite build`.
- `vite.config.ts` aliases `@` to the repository root and uses `__dirname`. Vite 8 printed a warning that `__dirname` is unsupported by the future native config loader. The current build still completed.
