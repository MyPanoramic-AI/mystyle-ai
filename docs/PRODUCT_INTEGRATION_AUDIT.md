# Product integration audit

Date: 21 October 2026.

## Customer journey continuity

Intended path: Registration → Email verification → Onboarding → Home → Stylist → Wardrobe → Discover → Shop → Try On → Beauty → Family → Membership → Privacy.

| Segment | Continuity finding |
| --- | --- |
| Auth → Home | Session cookie + CSRF; verification banner when unverified |
| Onboarding → Profile | Saved via API; photos remain `TemporaryPhotos` blob URLs (not private media) |
| Home → modules | Subpages for discover/family/wardrobe/beauty/membership |
| Refresh | **Fixed in this phase:** `sessionStorage` restores primary tab + subpage (not deep inner tabs) |
| Account isolation | API + browser isolation tests for wardrobe/family/beauty/credits |
| Demo vs account | Demonstration browsing is labelled; import review avoids silent family import |

## Data consistency

| Domain | Store | Issue |
| --- | --- | --- |
| Profile / preferences | SQLite | Consistent for signed-in accounts |
| Wardrobe / looks / plans | SQLite | Owner-scoped |
| Beauty / family | SQLite | Owner-scoped; demo seeds not imported |
| Stylist conversations | SQLite | Mock replies; not live provider text |
| Membership credits | SQLite ledger | **Not debiting** stylist mock messages; UI still has separate browser demo plan/credits |
| Shop wishlist | localStorage (`savedProductsService`) | `/api/saved-products` not called from client |
| Shop / Discover / Try On consumer | In-app demo data | Must stay labelled |
| Onboarding photographs | React state / object URLs | Not mapped to `media_assets` |

## AI stylist ↔ membership credits

The AI Coordinator enforces consent, budgets (`AI_MAX_*`), and mock/live gates. Membership `reserveCredits` / settlement exist for operator/admin flows and are **not** wired into stylist message send. Future work: map stylist operations to credit reservations when live AI is approved, without double-charging mock traffic.

## Shopping / try-on boundaries

- Consumer Shop and Try On remain demonstration surfaces.
- Labs stay separate processes with their own tokens and private dirs.
- No live retailer or FASHN calls in consumer e2e (external request watchers used in places).

## Profile photograph integration plan (not implemented)

Slots in `Step7Photographs.tsx`:

1. `profilePhotoUrl` — head and shoulders  
2. `fullBodyFrontUrl` — full length front  
3. `fullBodyAdditionalUrl` — additional angle / drape  

Proposed later work (requires approval):

1. Explicit adult consent checkbox before upload.  
2. Upload via existing `/api/media` with purpose metadata per slot.  
3. Store media ids on profile (new columns or JSON), not blob URLs.  
4. Owner-only GET; replace/delete with reauth where sensitive.  
5. Retention aligned with privacy policies.  
6. Separate consent before any future external AI vision use.  

**RC status:** pending — clearly marked in inventory and gaps.

## Corrections in this phase

1. Persist primary navigation across refresh (`App.tsx` sessionStorage).  
2. Lazy-load Discover, Family, Wardrobe, Beauty, Membership screens (main JS chunk ~926 kB → **639.48 kB** gzip **169.47 kB**).  
3. Broaden axe scans to primary modules.  
4. Add navigation-restore Playwright coverage.
