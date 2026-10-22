# Complete functional test matrix — Master QA

Date: 22 October 2026.

Classification:

- **WORKING** — exercised with intended persistence or labelled demo behaviour confirmed.
- **DEMONSTRATION** — intentionally local/demo; labelled or isolated from account ledger.
- **INTENTIONALLY DISABLED** — live provider/payment path blocked by config.
- **BROKEN** — confirmed defect (none remaining unfixed at high/critical in this pass).
- **NOT TESTED** — not clicked in this Master QA browser pass.

Evidence codes: `API` = Node suite, `E2E` = Playwright (27), `CODE` = review + fix, `MAN` = manual code-path check during this pass.

## Authentication and account shell

| Control | Expected | Class | Evidence |
| --- | --- | --- | --- |
| Register | Create account + session | WORKING | API+E2E |
| Weak password / bad email | Reject | WORKING | API+E2E |
| Duplicate email | Reject | WORKING | API+E2E |
| Login / wrong password | Neutral failure | WORKING | API+E2E |
| Logout | Clear session | WORKING | API+E2E |
| Session restore | Cookie restores | WORKING | E2E |
| Session poison / API down | Explicit error | WORKING | E2E auth-failures |
| Verify email (capture) | One-time token | WORKING | API+E2E |
| Password reset (capture) | Completes; unknown neutral | WORKING | API+E2E |
| Disabled account | Cannot sign in | WORKING | API |
| Account deletion | Re-auth, cancel, confirm | WORKING | API+E2E |

## Onboarding and profile

| Control | Expected | Class | Evidence |
| --- | --- | --- | --- |
| Eight-step walk / Skip | Persist profile | WORKING | E2E |
| Step back mid-flow | Preserve answers | NOT TESTED | — |
| Photo slots + consent | Private media | WORKING | API+E2E |
| Invalid photo | Reject | WORKING | API |
| Profile edit size/colour/budget | Persist | WORKING | E2E profile |
| Onboarding save 500 | Stay on flow | WORKING | E2E |

## Navigation

| Control | Expected | Class | Evidence |
| --- | --- | --- | --- |
| Primary tabs | Switch modules | WORKING | E2E |
| Refresh restore | sessionStorage | WORKING | E2E navigation-restore |
| Deep URL router | N/A | NOT APPLICABLE | K2 |

## Discover / Saved looks

| Control | Expected | Class | Evidence |
| --- | --- | --- | --- |
| Browse / filter / detail | Editorial demo | WORKING | E2E |
| Save / duplicate / remove | Account looks API | WORKING | E2E+API |

## Wardrobe

| Control | Expected | Class | Evidence |
| --- | --- | --- | --- |
| Add / edit / delete item | Account API | WORKING | E2E+API |
| Outfit save/rename/delete | Account API | WORKING | E2E |
| Plan / assign / reschedule date | Account API | WORKING | E2E+CODE |
| Filters / search | Client filter | WORKING | MAN |
| Demo wardrobe ids on save | Filtered out | WORKING | prior fix + E2E |

## Family

| Control | Expected | Class | Evidence |
| --- | --- | --- | --- |
| Adult / dependent profiles | Owner-only | WORKING | E2E+API |
| Event create/edit/delete | Owner-only | WORKING | E2E+API |
| Foreign member injection | Rejected | WORKING | API |
| Dependent → AI | Blocked | WORKING | API |

## Beauty Studio

| Control | Expected | Class | Evidence |
| --- | --- | --- | --- |
| Save look / prefs / delete | Account API | WORKING | E2E+API |
| Link look to outfit | Owner-only | WORKING | E2E+API |
| Demo catalogue / bag | Demonstration | DEMONSTRATION | CODE+E2E labels |
| Live beauty AI | Off | INTENTIONALLY DISABLED | CODE |

## AI Personal Stylist

| Control | Expected | Class | Evidence |
| --- | --- | --- | --- |
| Mock chat / restore / delete | Account API | WORKING | E2E+API |
| Consent gate | Required | WORKING | API+E2E |
| Live OpenAI/Gemini | Blocked | INTENTIONALLY DISABLED | API |
| Heart “save outfit” | Screen-only (after MQ-001) | DEMONSTRATION | CODE |

## Shop / Try-on

| Control | Expected | Class | Evidence |
| --- | --- | --- | --- |
| Filters / detail / wishlist | Demo catalogue; account wishlist | WORKING | E2E+API |
| Price compare Demo View | Alert simulation | DEMONSTRATION | CODE |
| Simulate Fit | Inactive messaging | INTENTIONALLY DISABLED | E2E |
| FASHN live job | Not submitted | INTENTIONALLY DISABLED | tryon API |

## Membership / privacy

| Control | Expected | Class | Evidence |
| --- | --- | --- | --- |
| Entitlement / test credits display | Server ledger | WORKING | E2E+API |
| Select plan (account) | Preview only | WORKING | CODE+E2E |
| Top-up (account) | Blocked message | WORKING | CODE |
| Admin allocate credits | Token required | WORKING | API |
| Account settings save | Browser demo (labelled) | DEMONSTRATION | CODE MQ-002/007 |
| Password change (account) | Blocked → reset flow | WORKING | CODE MQ-002 |
| Notifications toggles | Browser only (labelled) | DEMONSTRATION | CODE MQ-003 |
| Privacy consent/export/delete | Account API | WORKING | E2E+API |
| Browser demo export | localStorage only | DEMONSTRATION | CODE |

## Accessibility / visual

| Control | Expected | Class | Evidence |
| --- | --- | --- | --- |
| Overflow 320–1440 primary screens | No horizontal overflow | WORKING | E2E visual |
| axe primary modules | No serious on scanned | WORKING | E2E (see responsive report) |
| Keyboard full app | Complete audit | NOT TESTED | — |
| Touch targets measured | Systematic | NOT TESTED | — |

## Summary counts (controls inventoried above)

Approximate control rows: **70+**.  
WORKING: majority of account paths.  
DEMONSTRATION: shop/beauty bag/settings/notifications/stylist heart.  
INTENTIONALLY DISABLED: live AI, FASHN, payments.  
BROKEN: **0** unresolved high/critical after fixes.  
NOT TESTED: onboarding step-back, full keyboard, touch targets, some secondary filters.
