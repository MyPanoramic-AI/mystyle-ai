# Final feature inventory

Date: 22 October 2026. Source of truth: repository code and automated tests for Prompt 16 (unique Node 108; Chrome e2e 27). Classifications are evidence-based.

Legend:

| Class | Meaning |
| --- | --- |
| IMPLEMENTED AND BROWSER VERIFIED | API + Chrome Playwright coverage |
| IMPLEMENTED AND API VERIFIED | Automated Node/API tests; limited or no browser path |
| IMPLEMENTED BUT UNVERIFIED | Code present; coverage incomplete |
| DEMONSTRATION ONLY | UI present; not backed by live/production capability |
| EXTERNAL INTEGRATION PENDING | Adapter or lab exists; live connection off |
| NOT IMPLEMENTED | Missing or only placeholder |
| BLOCKED | Requires approval, legal, paid plan, or external party |

## Matrix

| Feature | Classification | Evidence / notes |
| --- | --- | --- |
| Registration / login / logout / session restore | IMPLEMENTED AND BROWSER VERIFIED | `auth` API + e2e journeys |
| Email verification (local capture) | IMPLEMENTED AND BROWSER VERIFIED | `email-security` API + e2e; **not** live mail |
| Password recovery (local capture) | IMPLEMENTED AND BROWSER VERIFIED | Same; sessions revoked on reset |
| Onboarding (8 steps) | IMPLEMENTED AND BROWSER VERIFIED | Profile fields + private photo slots with consent |
| Customer style profile | IMPLEMENTED AND BROWSER VERIFIED | Profile e2e + API |
| Digital Wardrobe | IMPLEMENTED AND BROWSER VERIFIED | Pieces, outfits, plans |
| Outfit Builder / Studio | IMPLEMENTED AND BROWSER VERIFIED | Wardrobe e2e |
| Outfit Planner | IMPLEMENTED AND BROWSER VERIFIED | Plans CRUD + date reschedule |
| Saved Looks (Discover) | IMPLEMENTED AND BROWSER VERIFIED | Discover e2e |
| Discover catalogue | DEMONSTRATION ONLY | Editorial/demo looks; not retailer stock |
| Family Styling | IMPLEMENTED AND BROWSER VERIFIED | Profiles + events; dependents non-login |
| Beauty Studio | IMPLEMENTED AND BROWSER VERIFIED | Saves/links; generation inactive |
| AI Personal Stylist | IMPLEMENTED AND BROWSER VERIFIED (mock) | Mock provider; live OpenAI/Gemini **EXTERNAL INTEGRATION PENDING / BLOCKED** until approved |
| Consumer Shop | DEMONSTRATION ONLY | Explicit demo labelling |
| Shopping wishlist (account) | IMPLEMENTED AND BROWSER VERIFIED | Demo catalogue refs on `/api/saved-products` |
| Shopping Lab | IMPLEMENTED AND API VERIFIED | Isolated lab; not consumer surface |
| Consumer Try On | DEMONSTRATION ONLY | Inactive generation copy |
| FASHN Try-On Lab | IMPLEMENTED AND API VERIFIED | Live jobs **BLOCKED** / off by default |
| Membership entitlements + credit ledger | IMPLEMENTED AND BROWSER VERIFIED (read) | Free entitlement; Preview read-only; no payments |
| Privacy consent / export / deletion | IMPLEMENTED AND BROWSER VERIFIED | Includes private photo storage consent; retention dry-run only |
| Hosting / Render persistence | BLOCKED (Free plan) | Disk required; see Render assessment |
| SQLite backup / restore | IMPLEMENTED AND API VERIFIED | Local operator tooling |
| Profile photograph private upload | IMPLEMENTED AND BROWSER VERIFIED | Three slots → private media; not sent to external AI |
| Payments / paid plans | NOT IMPLEMENTED / BLOCKED | Prices provisional |
| Live transactional email | EXTERNAL INTEGRATION PENDING | Capture only |
| POPIA legal compliance | BLOCKED | Technical controls ≠ legal certification |

## Production-capable vs local-only

| Area | Production-capable (with disk + HTTPS + secrets) | Local / test only |
| --- | --- | --- |
| Express account API + SQLite domains | Yes, after persistence | — |
| Email capture mailbox `/api/dev/mailbox` | **No** — refused outside development/test | Yes |
| Shopping / Try-On labs | Should remain private | Local labs |
| Live AI / FASHN / retailers / payments | Not enabled | Mock / demo |
