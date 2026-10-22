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

## Totals this pass

| Category | Count |
| --- | --- |
| Found | 8 new/confirmed (MQ-001–006 + labelled residual MQ-007/008) |
| Critical | 0 |
| High corrected | 3 (MQ-001, MQ-002, MQ-005) |
| Medium corrected | 3 (MQ-003, MQ-004, MQ-006) |
| Remaining unresolved in product scope | K2, K3, K4 partial, K6, MQ-007, MQ-008, commercial blockers |
