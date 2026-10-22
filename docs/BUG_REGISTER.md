# Bug register — Master QA

Date: 22 October 2026. Tip before this pass: `8bf6f3b`. Isolated local environment only. No push, deploy, live AI, live email, retailer scrape, or payments.

## Severity legend

- **Critical** — data loss, security breach, or blocking crash in a primary path.
- **High** — wrong success feedback, account/data integrity failure, or customer-facing false claim.
- **Medium** — incorrect behaviour with workaround, or incomplete labelling.
- **Low** — cosmetic, copy, or non-blocking polish.

## Corrected in this Master QA pass

### MQ-001 — Stylist heart claimed a wardrobe save

| Field | Detail |
| --- | --- |
| Severity | High |
| Description | Heart/save on the stylist outfit card and try-on preview toasted “saved to your wardrobe” without writing to the wardrobe API or local wardrobe store. |
| Reproduction | Sign in → My Stylist → open a recommendation → Heart. Reload → outfit absent from Wardrobe. |
| Expected | Either persist to the account wardrobe or state that the keep is screen-only. |
| Actual | Success toast implied a wardrobe write. |
| Root cause | Local React state toggle only. |
| Fix | Toast copy states the keep is on-screen only and was not saved to wardrobe or account. Files: `OutfitRecommendationCard.tsx`, `TryOnPreviewModal.tsx`. |
| Evidence | Code review + regression of toast strings; e2e suite re-run after fix. |
| Status | Corrected |

### MQ-002 — Account password change fake success

| Field | Detail |
| --- | --- |
| Severity | High |
| Description | Membership → Account Settings → Change Password showed a success state without calling password-reset or update APIs. Dangerous when `usesAccount` is true. |
| Reproduction | Signed-in hub → Account Settings → Change Password → Update Password. Sign out and sign in with “new” password fails; old password still works. |
| Expected | Signed-in customers cannot simulate an account password change from this form. |
| Actual | “Password successfully updated in your simulated security profile.” |
| Root cause | Demonstration modal reused inside account-mode hub. |
| Fix | In account mode the modal blocks update and directs the user to Forgot password. Demo mode labels the action as demonstration-only. Files: `AccountSettingsView.tsx`, `MembershipHubScreen.tsx`. |
| Evidence | Code path review; membership e2e still passes. |
| Status | Corrected |

### MQ-003 — Notification preferences implied account delivery

| Field | Detail |
| --- | --- |
| Severity | Medium |
| Description | Toggles saved only to browser localStorage but success said “Notification preferences updated.” |
| Fix | Account-mode copy states browser-only storage and that no push/email/SMS channels were registered. Files: `NotificationPreferencesView.tsx`, `MembershipHubScreen.tsx`. |
| Status | Corrected |

### MQ-004 — Premature outfit save toast

| Field | Detail |
| --- | --- |
| Severity | Medium |
| Description | Wardrobe outfit save showed “Saving your outfit.” with the success Check toast before the API completed. |
| Fix | Removed the pending toast; success toast remains after a confirmed save. File: `WardrobeScreen.tsx`. |
| Status | Corrected |

### MQ-005 — Expired media left profile slot pointers

| Field | Detail |
| --- | --- |
| Severity | High |
| Description | `cleanupExpiredMedia` marked assets deleted and removed files but did not clear `customer_profiles` portrait/full-body media ids or wardrobe `media_id`. |
| Reproduction | Upload profile portrait with `retentionMs: -1` → POST `/api/media/cleanup` → GET `/api/profile/photos` still returned the old media id while GET `/api/media/:id` returned 404. |
| Expected | Slot references cleared when media is expired. |
| Root cause | Cleanup path duplicated delete logic without reference clearing. |
| Fix | Shared `clearMediaReferences`; cleanup uses it. Hardened media path containment with `path.sep`. Files: `server/api/src/media/store.ts`, `server/api/src/privacy/retention.ts`. |
| Evidence | New test `expired media cleanup clears profile photograph slot references` in `profile-photos.test.ts` — pass. |
| Status | Corrected |

### MQ-006 — Media path containment used bare `startsWith`

| Field | Detail |
| --- | --- |
| Severity | Medium (defence in depth; UUID keys already blocked traversal) |
| Description | `path.resolve(...).startsWith(mediaDir)` can match sibling prefixes (e.g. `media` vs `media-evil`). |
| Fix | Containment requires equality or `root + path.sep` prefix. |
| Status | Corrected |

## Open / accepted for later

| ID | Severity | Status | Notes |
| --- | --- | --- | --- |
| K2 | Medium | Open | Primary tab restore via sessionStorage; no URL router; inner tabs still reset. |
| K3 | Low | Open | Main JS ~645 kB / gzip ~171 kB; editorial JPEGs 605–989 kB. |
| K4 | Medium | Partially open | Most journeys covered by e2e; some edge clicks remain NOT TESTED (see matrix). |
| K6 | Medium | Open | Family occasion budgets remain planning figures without retail disclaimer on every row. |
| MQ-007 | Low | Open | Account Settings contact fields remain browser demonstration when signed in (now labelled). Full profile contact API wiring not in scope. |
| MQ-008 | Low | Open | Beauty shopping bag in account mode is an in-session demonstration list (already labelled). |
| COMM-* | Blockers | Open | Live email, AI, FASHN, retailers, payments, POPIA sign-off, Free Render disk — see `RELEASE_READINESS.md`. |

## Follow-up from audit subagents (same day)

Confirmed findings from [Security and auth audit](b58bbb67-425b-40bb-8d6d-13f4e1c1569b) and [API failure path hunt](8fe2d1c9-ff06-4011-82f9-e97ff1777616), plus [UI controls inventory](7064c86e-14e1-46b1-86d0-f41c8b35470d):

### MQ-009 — Customer global media cleanup

| Field | Detail |
| --- | --- |
| Severity | High |
| Description | `POST /api/media/cleanup` deleted expired media for **all** accounts. |
| Fix | Cleanup is scoped to the calling `userId`. Admin retention cleanup remains platform-wide. |
| Status | Corrected |

### MQ-010 — Retention preview leaked platform metrics

| Field | Detail |
| --- | --- |
| Severity | Medium |
| Description | Customer retention preview returned global expired/orphaned/deleted counts. |
| Fix | Account-scoped preview (`scope: "account"`); platform counts only on admin dry-run. |
| Status | Corrected |

### MQ-011 — Media upload without private photo consent

| Field | Detail |
| --- | --- |
| Severity | High |
| Description | `POST /api/media` accepted uploads without `private_photo_storage` consent. |
| Fix | Consent required before generic media save (same purpose as profile slots). |
| Status | Corrected |

### MQ-012 — Auth rate limit used proxy peer IP

| Field | Detail |
| --- | --- |
| Severity | Medium (hosted) |
| Fix | Rate-limit key uses `req.ip` (respects `trustProxy`). |
| Status | Corrected |

### MQ-013 — Credit refund left allocation `remaining` reduced

| Field | Detail |
| --- | --- |
| Severity | High |
| Fix | `refundConsumed` restores `allocation_periods.remaining`. |
| Status | Corrected |

### MQ-014 — Stylist orphan user message on provider failure

| Field | Detail |
| --- | --- |
| Severity | High |
| Fix | Roll back the inserted user message if `produce` throws. |
| Status | Corrected |

### MQ-015 — Discover Share claimed clipboard without writing

| Field | Detail |
| --- | --- |
| Severity | Medium |
| Fix | Fallback calls `navigator.clipboard.writeText` or reports unavailability. |
| Status | Corrected |

### MQ-016 — Header credits showed demo balance when signed in

| Field | Detail |
| --- | --- |
| Severity | Medium |
| Fix | Account mode loads server test credits for the header pill. |
| Status | Corrected |

### MQ-017 — Duplicate create returned HTTP 201

| Field | Detail |
| --- | --- |
| Severity | Low |
| Fix | Looks, saved-products, and pending deletion-start return **200** when duplicate. |
| Status | Corrected |

### Still open from UI inventory

| ID | Severity | Notes |
| --- | --- | --- |
| MQ-018 | Medium | Profile **Manage Photos** still has no add/upload control (onboarding Step 7 remains the upload path). |
| Orphan home widgets | Low | Unmounted components (`FeatureGrid`, etc.) — dead code, not user-facing. |

## Totals this pass

| Category | Count |
| --- | --- |
| Found | MQ-001–018 (plus commercial/K* open items) |
| Critical | 0 unresolved |
| High corrected | MQ-001, 002, 005, 009, 011, 013, 014 |
| Medium corrected | MQ-003, 004, 006, 010, 012, 015, 016 |
| Remaining unresolved in product scope | K2, K3, K4 partial, K6, MQ-007, MQ-008, MQ-018, commercial blockers |
