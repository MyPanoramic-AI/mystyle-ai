# Production Development Plan

Audit date: 16 October 2026.

The React frontend remains the client. Each phase replaces one demonstration behaviour or adds the server foundation it depends on. Phases are sequential where the dependency list says so. Status values are NOT STARTED, IN PROGRESS, BLOCKED, or COMPLETED, based on evidence from this repository after the audit.

Phase 1 is **IN PROGRESS**. The audit, build verification, and these documents are done. The baseline Git commit is not done, because this machine has no Git `user.name` or `user.email`, and Git configuration was not changed. Details are in `CURSOR_PROGRESS.md`.

## Phase 1 — Repository audit, documentation, and baseline verification

**Status:** IN PROGRESS

**Objectives**

- Inspect the exported prototype.
- Verify install, TypeScript, and the production build.
- Record which features are real, simulated, partial, or absent.
- Write the production plan without implementing it.

**Dependencies**

- The exported source tree.

**Tasks**

- Map the frontend, services, and data files.
- Initialise Git without deleting the export.
- Ignore secrets and build output.
- Install dependencies and run the existing scripts.
- Research try-on providers and lawful catalogue options without paid calls.
- Write the `docs/` set.

**Deliverables**

- This `docs/` directory.
- A passing `npm run lint` and `npm run build` record in `BUILD_AND_TEST_REPORT.md`.
- A baseline commit of the export.

**Acceptance criteria**

- Findings distinguish the running prototype from proposals.
- Build and TypeScript commands were executed and their real exit codes are recorded.
- No production API, provider call, or retailer connector was added.
- A baseline commit exists.

**Main risks**

- The missing Git identity blocks the last acceptance item.
- The handover document overstates verification. This plan treats the handover as background, not as test evidence.

**Tests**

- `npm run lint`, `npm run build`, and `npm test` were run. Results are in `BUILD_AND_TEST_REPORT.md`. `npm test` fails because there is no test script.

**Remaining to close the phase**

- Configure a real Git identity (outside this audit, because Git config must not be invented here) and create the baseline commit, then a second commit for the audit documents and the esbuild correction.

## Phase 2 — Virtual try-on provider feasibility experiment

**Status:** AWAITING LIVE VALIDATION

The local harness in `server/tryon-lab` is implemented and its mock tests passed on 16 October 2026. No live provider call has been made, so this phase is not complete and no provider is validated.

**Objectives**

- Prove or reject a specialist try-on API with adult images we have rights to use.
- Record latency, failures, and actual cost.

**Dependencies**

- Phase 1 documentation.
- Operator approval of a small spend.
- Image rights for the test set.
- Re-check of the provider pages in `VIRTUAL_TRYON_FEASIBILITY.md` on the test day.

**Tasks**

- Prepare the fixed adult image set.
- Call FASHN from a server script. Add Google `virtual-try-on-001` only if billing and the model lifecycle are acceptable that day.
- Score identity and garment fidelity.
- Record at least one forced failure.

**Deliverables**

- Experiment notes in `CURSOR_PROGRESS.md`.
- Stored output images outside the web root, or an explicit statement that no call was made.

**Acceptance criteria**

- Every call has a start time, end time, status, and cost or a documented billing error.
- No customer upload and no child image was sent.
- A provider is either accepted for Phase 4 integration or rejected with the rubric attached.

**Main risks**

- FASHN requires a paid credit purchase before a key exists.
- Google's public discontinuation dates conflict across pages.
- Editorial photos in the repo may be unsuitable garment cut-outs.

**Tests**

- The protocol in `VIRTUAL_TRYON_FEASIBILITY.md`, including the failure cases.

## Phase 3 — South African retailer-data feasibility experiment

**Status:** IN PROGRESS. The local shopping engine and feasibility matrix exist. No authorised feed has been ingested, so the commercial integration is not complete.

**Objectives**

- Determine which target retailers can be searched through a licensed feed or API.
- Ingest a small sample only if access is actually granted.

**Dependencies**

- Phase 1.
- A publisher or partner application. This can proceed beside Phase 2.

**Tasks**

- Check each retailer named in `SouthAfricanRetailer` against affiliate directories and direct-feed options.
- Do not mark a retailer as available because a scraper project on the public internet claims to read it.
- If one feed is obtained, load a sample and manually verify 10 URLs.

**Deliverables**

- A retailer availability table: feed available, feed denied, or not confirmed.
- Sample rows only for a feed that was really downloaded.

**Acceptance criteria**

- Every live-looking row has `source`, `product_url`, and `verified_at`.
- Retailers without a feed stay unavailable.
- No scraper is the default pipeline.

**Main risks**

- The commercially important retailers may not offer a publisher feed.
- Image licences may allow display and still forbid sending the image to a try-on provider.

**Tests**

- Manual URL checks described in `SA_RETAILER_INTEGRATION_PLAN.md`.

## Phase 4 — Secure Node.js backend foundation

**Status:** FOUNDATION PRESENT. `server/api` boots on `127.0.0.1:4331`, migrates SQLite, and passes its automated tests. It is not connected to the React app. Try-on jobs stay in the separate try-on lab. Phase 4 is not a commercial launch.

**Objectives**

- Add an Express service, SQLite, private file storage, and a job table.
- Leave the React UI on its current demonstration services until later phases connect them.

**Dependencies**

- Phases 2 and 3 should be far enough along that the server is built for a known provider and a known catalogue shape. The empty server skeleton can start after Phase 1 is closed if the experiments slip, but provider-specific code waits for Phase 2.

**Tasks**

- New `server/` module as described in `PROPOSED_BACKEND_ARCHITECTURE.md`.
- Configuration via environment variables that are not prefixed for Vite.
- Health check, migrations, and a backup note for the SQLite file.

**Deliverables**

- A server that boots, migrates, and exposes health.
- Repository interfaces for accounts, media, and jobs.

**Acceptance criteria**

- Automated tests cover migration and one repository round-trip.
- The Vite build still passes.
- The media directory is not publicly served.

**Main risks**

- Mixing API routes into the Vite dev server and leaking credentials into the client bundle.

**Tests**

- New Node tests for the repository and health route. Frontend `npm run build` remains green.

## Phase 5 — Authentication, profiles, and private photographs

**Status:** PARTIAL, CONNECTED FOR ACCOUNTS. Registration, login, logout, refresh, onboarding, and profile edits in the React app use `server/api` when the local API is running. Demonstration mode stays on `localStorage` and is labelled. Email verification, password recovery, and private photo upload from onboarding are not available. Child photographs are refused. Demonstration family records are not imported.

**Objectives**

- Adult accounts, server-side profiles, upload, and deletion.

**Dependencies**

- Phase 4.

**Tasks**

- Register, login, logout, session cookie.
- Profile API matching `UserProfile`, without seeding the demonstration person.
- Media upload and delete with consent rows.

**Deliverables**

- The profile service can be switched to the API for a signed-in user.
- Deletion removes the file and the database row's active state.

**Acceptance criteria**

- A second account cannot read the first account's photograph.
- Export includes the profile fields the current export omits.
- Child profiles are not accepted by the API.

**Main risks**

- The current UI assumes a profile always exists and is pre-completed. Empty states will need care without a visual redesign.

**Tests**

- Two-account authorisation tests. Upload and delete tests using a tiny fixture image, not a customer photo.

## Phase 6 — Real AI stylist and specialist coordination

**Status:** NOT STARTED

**Objectives**

- Replace the keyword stylist with the coordinator for text styling, still refusing unverified offers.

**Dependencies**

- Phase 5. Phase 2's chosen try-on adapter can be attached in this phase or Phase 7, but it must already have passed Phase 2.

**Tasks**

- Implement the coordinator and one text provider adapter.
- Persist tasks and costs.
- Point `StylistChatScreen` at the API while keeping the current layout.

**Deliverables**

- Schema-validated style responses.
- Ledger entries for successful billable calls.

**Acceptance criteria**

- A shopping-like question returns either catalogue rows or an explicit empty result. It does not return a made-up rand amount.
- Spend ceiling stops calls when exceeded.
- The demonstration keyword engine remains available only as a development fallback.

**Main risks**

- The model ignoring the schema. Validation has to discard the response, not display it.

**Tests**

- Contract tests with a fake provider. One live call only after the fake-provider tests pass, recorded with its cost.

## Phase 7 — Connect shopping results to virtual try-on

**Status:** NOT STARTED

**Objectives**

- A licensed product can be tried on only when the image licence allows the provider call.

**Dependencies**

- Phases 2, 3, and 6.

**Tasks**

- Catalogue search endpoint.
- Try-on job that accepts a catalogue item id.
- Shop "try this" uses the job when the item is verified, and stays on the current demonstration behaviour for `Demo Listing` rows.

**Deliverables**

- End-to-end path for one licensed product.
- Rejection path when the licence or the garment image is missing.

**Acceptance criteria**

- Demonstration products cannot be sent to a paid provider by accident.
- Job success and job failure are both visible in the existing Try On screen without inventing an image.

**Main risks**

- Feed images are lifestyle photos rather than isolated garments, which may fail the try-on rubric.

**Tests**

- Licence gate test. One real try-on of a licensed product, with cost recorded.

## Phase 8 — Connect existing frontend modules to genuine services

**Status:** Wardrobe, saved outfits, Discover inspirations, outfit plans, family styling, and saved beauty selections are connected for signed-in accounts. Beauty image generation remains disconnected.

**Objectives**

- Move wardrobe and saved items onto the API. This part is done for authenticated customers. See `WARDROBE_INTEGRATION.md`.
- Family profiles and family event plans are saved for the signed-in adult. See `FAMILY_STYLING_INTEGRATION.md`. Dependent profiles cannot sign in. Demonstration family records are not imported.
- Beauty preferences and saved inspiration looks are stored for the signed-in adult. See `BEAUTY_STUDIO_INTEGRATION.md`. No photograph is generated or sent to a model.
- Leave beauty image generation on the disconnected path.

**Dependencies**

- Phase 5. Shopping and try-on connections from Phase 7 where those screens link out.

**Tasks**

- Replace `wardrobeService`, `savedLooksService`, and `savedProductsService` internals.
- Remove the direct `localStorage` write in `WardrobeScreen.tsx`.
- Keep gaps and capsules labelled as demonstration until a real wardrobe analysis exists.

**Deliverables**

- Wardrobe items survive on the server for the signed-in adult.
- Unsplash demonstration items are not copied into new accounts.

**Acceptance criteria**

- Refresh keeps the server wardrobe.
- Signing out does not show another user's items.
- Existing visual layout of the wardrobe screen remains.

**Main risks**

- First-run seeding in the current services would overwrite a real wardrobe if it stays in the production path.

**Tests**

- Service tests against the API. Manual pass through wardrobe, saved looks, and saved products.

## Phase 9 — Subscription infrastructure, credits, and administration

**Status:** ACCOUNTING FOUNDATION ONLY. Plan definitions, server entitlements, the integer ledger, reservations, and operator routes exist. Payment capture has not started. Provisional prices and proposed allowances are not approved commercial terms.

**Objectives**

- Real entitlements and an operator view of cost.
- Payment capture only when a South African provider is chosen and tested. Until that test, pilot entitlements stay manual.

**Dependencies**

- Phases 4 and 6.

**Tasks**

- Ledger as the balance.
- Admin job and cost views.
- Decide PayFast or another acquirer in a separate implementation step. Do not pretend the current R149 and R349 buttons charge a card.

**Deliverables**

- Manual entitlement changes for pilot users.
- A cost report per provider and per day.

**Acceptance criteria**

- The membership UI cannot report a successful payment that did not happen.
- Credits move only through the ledger.

**Main risks**

- The current screens copy over-claims plan features (4K try-on, WhatsApp concierge) that the proof of concept does not have. Copy has to be narrowed when this phase starts, without a visual redesign.

**Tests**

- Ledger concurrency test. Admin authorisation test.

## Phase 10 — Privacy, security, performance, and end-to-end testing

**Status:** PRIVACY CONTROLS FOUNDATION + INFRASTRUCTURE PREP (local). Consent history, authenticated export, account deletion, media delete, and retention dry-run exist. Destructive cleanup stays disabled. The draft privacy notice is not legally approved. Live AI and payments remain off.

**Infrastructure (21 October 2026):** Production architecture, Render persistence assessment, environment profiles, SQLite backup/restore, health/ready split, observability plan, and deployment/rollback runbooks are documented and tested locally. **Not done:** paid Render disk, staging service, GitHub push, live cutover. Free-plan ephemeral storage remains a production blocker. See `PRODUCTION_ARCHITECTURE.md` and `RENDER_DEPLOYMENT_ASSESSMENT.md`.

**Account security (21 October 2026):** Email verification and password recovery are implemented with a local capture mailer. Live provider integration is not started. See `EMAIL_VERIFICATION_IMPLEMENTATION.md` and `PASSWORD_RECOVERY_IMPLEMENTATION.md`.

**Status:** IN PROGRESS as of 21 October 2026. Browser journeys and regression suites pass locally. Commercial launch hosting and live email are still blocked. See `END_TO_END_TEST_REPORT.md`, `INFRASTRUCTURE_TEST_REPORT.md`, and `ACCOUNT_SECURITY_TEST_REPORT.md`.

**Objectives**

- Close the gaps in `SECURITY_REVIEW.md` for the paths that are actually live.
- Add automated coverage for the connected flows.

**Dependencies**

- The phases that introduced those paths.

**Tasks**

- Access export, deletion, retention job, and consent withdrawal.
- Security headers, rate limits, and a dependency review.
- Code-splitting only if the 853 kB bundle is still a measured problem after the API split.
- Browser pass of every connected screen on a desktop and a mobile viewport.

**Deliverables**

- Test report with commands and results.
- A short threat review of the implemented server.

**Acceptance criteria**

- Export contains profile, media metadata, and ledger.
- Delete removes private files.
- No provider key in the client bundle.

**Main risks**

- Treating the Phase 1 `npm audit` result as ongoing coverage.

**Tests**

- End-to-end tests for register, upload, try-on failure, shop empty state, and delete.

## Phase 11 — Controlled pilot with invited adult users

**Status:** NOT STARTED

**Objectives**

- Run the connected product with a named list of adults.

**Dependencies**

- Phases 5 through 10 for the features included in the pilot. Unconnected modules stay visibly demonstrative.

**Tasks**

- Invite accounts.
- Monitor cost daily.
- Collect qualitative notes on try-on identity and price trust.

**Deliverables**

- Pilot notes in `CURSOR_PROGRESS.md`.
- A decision to continue, narrow, or stop.

**Acceptance criteria**

- Every participant is an adult.
- No child-photo path was enabled.
- Incidents and costs are recorded.

**Main risks**

- A participant uploading a family member's photograph. The pilot instructions and the server adult-only check both have to hold.

**Tests**

- Pilot checklist executed and filed. Production monitoring of job failures.

## Phase 12 — Commercial launch preparation

**Status:** NOT STARTED

**Objectives**

- Prepare the operational, legal, and support pieces that a public launch needs beyond a working pilot.

**Dependencies**

- A successful Phase 11 decision.
- Legal review of POPIA notices, provider contracts, and retailer licences. Engineering does not self-certify that review.

**Tasks**

- Payment go-live if Phase 9's provider passed.
- Public privacy notice matching the real data flows.
- Backup restore drill.
- Support process for deletion requests.
- Remove or permanently label every remaining demonstration price.

**Deliverables**

- Launch checklist with owners.
- Restore drill record.

**Acceptance criteria**

- A new user cannot see a demonstration price presented as a live retailer price.
- Restore from backup has been executed once.
- Provider and retailer contracts match the processors and feeds in production.

**Main risks**

- Launching on the strength of the prototype UI while catalogue coverage is still thin.

**Tests**

- Full regression of the pilot paths plus the payment sandbox, if payments are in the launch.

## Suggested immediate sequence

Close Phase 1's Git commit, then run Phase 2. Phase 3 can start as soon as a person can apply for publisher access. Do not open provider accounts or accept retailer terms as part of an unapproved coding session.

## Update, 20 October 2026

Accounts are connected, and the stylist coordinator is in `server/api` with a mock provider. Live model calls, FASHN, retailer feeds, and payments remain off. The next milestone is an approved live stylist test, described in `AI_STYLIST_LIVE_TEST_PLAN.md`. Do not treat the mock replies as a quality score for a live model.

## Update, 20 October 2026 — QA

Playwright now runs the React app and API in Chrome against a temporary database. Seven browser tests passed. They cover registration and sign-in, invalid registration, an onboarding skip walk, shop and try-on labelling, a mock stylist conversation, one wardrobe/family/beauty persistence and isolation path, and horizontal overflow at six widths. Discover, profile editing, outfit planning, and several negative paths were not clicked. The header overflow at 768px and empty image sources were corrected. The client chunk is still 909.60 kB. Do not start the live stylist test until the remaining browser steps are either executed or explicitly accepted as out of scope, and do not enable a paid provider while closing them.
