# Security and Privacy Review

Audit date: 16 October 2026. This is a review of the current frontend plus the requirements for production. No personal photograph was uploaded to an external AI service during this audit.

## Current exposure

### Secrets

- No live API key was found in source.
- `.env.example` contains the placeholders `MY_GEMINI_API_KEY` and `MY_APP_URL`.
- `.gitignore` ignores `.env*` and re-includes `.env.example`.
- The frontend does not read `GEMINI_API_KEY`. `@google/genai` is unused.
- `metadata.json` requests a server-side Gemini capability that this repository does not implement.

Risk if a later change exposes the key through a `VITE_` variable: the key would ship in the JavaScript bundle. Production AI calls must stay on the server.

### localStorage

The browser store is origin-wide, unencrypted, and persistent. Any script running on the app origin can read it. The prototype currently stores:

| Key | Contents |
| --- | --- |
| `mystyle_ai_user_profile_v1` | Name, age range, height, country, sizes, bust, waist, hip, style, colours, budget, retailers |
| `mystyle_family_members_v1` | Names, relationships, adult/child classification, ages, sizes, budgets. The seed data includes two child profiles |
| `mystyle_saved_family_plans_v1` | Family outfit plans |
| `mystyle_wardrobe_items_v1` | Garment records and image URLs |
| `mystyle_wardrobe_outfits_v1` | Outfit records |
| `mystyle_wardrobe_events_v1` | Planned events and locations |
| `mystyle_saved_beauty_looks_v1` | Saved beauty looks |
| `mystyle_beauty_shopping_bag_v1` | Beauty product bag |
| `mystyle_saved_looks_v1` | Saved discover looks |
| `mystyle_saved_products_v1` | Saved shop products |
| `mystyle_membership` | Simulated plan |
| `mystyle_credits` | Simulated balance |
| `mystyle_credit_transactions` | Simulated ledger |
| `mystyle_account_settings` | Demonstration name, email `nandi.mthembu@capestyle.co.za`, phone `+27 82 459 8812`, city, and login toggles |
| `mystyle_privacy_settings` | Local preference flags |
| `mystyle_notification_settings` | Local channel flags |

`familyService` no longer writes demonstration profiles when the module loads. Demonstration screens still read those samples from memory. A signed-in family screen does not call that service, so the samples are not copied to the account.

Photographs from onboarding are `blob:` URLs in React state. They are not in the keys above. They disappear on refresh. The privacy screen's "store high-resolution try-ons locally" and "ephemeral fitting photos" toggles do not govern this behaviour. They only persist booleans.

### Misleading controls

These are product-integrity issues as well as privacy issues:

- Password update reports success and does not authenticate anything.
- Two-factor and biometric flags default to enabled and have no implementation.
- Google and WhatsApp "connect" toggles do not perform OAuth or a WhatsApp link.
- Data export omits profile measurements, wardrobe, family members, and saved looks.
- Reset copy says wardrobe and profile return to defaults. `resetAllDemoData` deletes only the membership keys.
- Family and photograph copy says data is never uploaded and, in places, implies a browser session. `localStorage` survives sessions. The "never uploaded" sentence is accurate only while no backend exists.

### Content and images

- No `dangerouslySetInnerHTML` or `eval` usage was found under `src/`.
- Wardrobe add-item accepts an image URL and can render it in an `<img>`. That can cause the browser to request an arbitrary third party. It is not an HTML injection sink by itself. Production uploads must be file-based, typed, size-limited, and stored privately.
- Unsplash URLs in wardrobe and family data cause the browser to contact Unsplash when those screens render. Those requests are not a product API, and the licence for commercial use of each hotlinked file has not been reviewed.
- Bundled JPEGs in `src/assets/images/` are part of the prototype. Their commercial licence is not documented in the repository.

### Dependencies

`npm install` reported `found 0 vulnerabilities` for the resolved tree on 16 October 2026. That scan is not a penetration test. Unused packages (`express`, `dotenv`, `@google/genai`, `motion`) still enlarge the install. They were left in place during this audit so the export was not casually trimmed.

### Access model

There is no login, no role, no server session, and no per-person isolation beyond "whoever uses this browser profile". A shared computer shares the demonstration wardrobe and family records.

## Production security requirements

### Identity

- Email or phone verification for adult accounts. Session cookies must be `HttpOnly`, `Secure`, and `SameSite`.
- Passwords, if used, hashed with a current password hashing algorithm on the server. The prototype password modal must not be wired to a real account as it stands.
- No third-party login toggle until that provider's OAuth flow exists.
- Staff administration uses separate accounts and an audit log.

### POPIA

The product will be aimed at people in South Africa. The operator will need a lawful basis, a privacy notice, and a record of processing before real customer data is collected. Practical obligations to design for:

- Purpose specification. Style advice, try-on, and shopping are separate purposes. Do not reuse photographs for marketing because a styling consent existed.
- Data minimisation. Collect the measurements a recommendation actually uses. Do not require a full-body photograph for text styling.
- Consent that names the provider when a photograph will leave MyStyle AI infrastructure.
- A data-subject access export that includes profile, measurements, family records, wardrobe metadata, consents, and generation history. The current JSON download does not.
- Correction and deletion, including deletion of derived images.
- Retention limits. The privacy screen's `dataRetentionMonths` value is currently a stored number with no enforcer.
- Operator security: encryption in transit, encryption at rest for photographs, access logs, and a process for breach notification.
- Cross-border transfers. FASHN and Google Cloud processing may occur outside South Africa. The privacy notice and contracts have to cover that before a customer photograph is sent.

This review is an engineering checklist, not a legal opinion.

### Children

POPIA gives additional protection to personal information of children. The proof of concept must not:

- upload a child's photograph
- send a child's name, age, or measurements to an AI provider
- generate a try-on or beauty render of a child

The current family UI stores a dependent planning record for a signed-in adult. That record has a display name, relationship, optional sizes, colours, and a planned budget. It has no login, no photograph, and no date of birth. It is not included in the stylist context or sent to OpenAI, Gemini, FASHN, or a retailer. Legal review is still required before any wider use of dependent information. See `FAMILY_PRIVACY_AND_PERMISSIONS.md`.

### Photographs

- Accept images only from an authenticated adult account.
- Restrict type and size (the Google try-on documentation reviewed for this audit cites JPEG and PNG and a maximum around 7–10 MB, depending on the product page).
- Store originals in a private store, not in a public bucket and not in `localStorage`.
- Serve them with short-lived signed URLs.
- Delete the object, the derivatives, and the provider temporary copy when the customer deletes the photo or when ephemeral mode is actually implemented.
- Do not log image bytes or base64 bodies.
- Record provider, model name, request id, duration, and cost. Do not record the image in the application log.

### AI and shopping integrity

- Provider keys live in server environment variables.
- Rate limits, per-user credit checks, and a global spend ceiling run on the server before a paid call.
- Shopping responses may only contain offers that came from a licensed feed or API, with source and verification time. The model must not be allowed to fill a missing price.

### Application hardening for the later backend

- Validate every request body on the server.
- Authorise every object by the owning account. Family access, when it exists, is an explicit grant, not a shared browser.
- CSRF protection for cookie sessions.
- Security headers and a restrictive image content-security policy.
- Dependency review on each production release, not only the zero-vulnerability result from this install.

## Account API controls, 16 October 2026

`server/api` binds to `127.0.0.1` or `localhost` only. Passwords are hashed with scrypt. The session token is stored as a SHA-256 hash and returned only in an HttpOnly, SameSite=Lax cookie. The cookie is not marked Secure because the local server is HTTP; a public deployment would need TLS and the Secure flag, and this session did not deploy anything. Mutating cookie requests require an `x-csrf-token` that matches the session. A browser `Origin` that is not on `API_ALLOWED_ORIGINS` is rejected. The allow-list is empty by default, so the Vite app cannot call the API until that is an explicit later change.

Login uses one message for an unknown email and a wrong password. Duplicate registration returns `duplicate_email`, which does reveal that the address exists. Disabled accounts return `account_disabled`. Email verification and password recovery are not implemented. There is no route that grants credits or a paid plan. Photographs are magic-byte checked, size limited, stored under `server/api/private/media` with UUID names, and readable only by the owner. Purposes containing child, minor, or dependent are refused. Logs are event names and the listen port. The health failure response does not include a filesystem path or a stack.

The React app now signs in through the Vite proxy. The session cookie stays HttpOnly. The CSRF token is kept in memory and sent as `x-csrf-token`. A saved browser style profile is shown for review and is not uploaded until the customer selects it. Family, wardrobe, beauty, membership, and credit keys are never included. Measurements are omitted unless that box is ticked. Opening the app at an address other than the local Vite origins is rejected by the origin check.

Signed-in beauty preferences and saved inspiration looks are owner-scoped. The beauty routes refuse photographs, face data, and health details. A beauty look can link only to an outfit or plan owned by the same account. The coordinator still reports beauty image generation as not connected, and beauty preferences are not added to the stylist prompt. Demonstration beauty keys remain blocked from account import.

## Stylist controls, 20 October 2026

Stylist routes require the same session and CSRF checks. A conversation query always includes the signed-in user id, and another account receives 404. Personalisation is sent to a provider only when `ai_personalisation_consent` is true, and then only as styles, colour lists, size labels, budget band, shopping priorities, and retailer names. Display name, age, measurements, photographs, and family records are not included. Consent defaults to off.

The Gemini key is read from `GEMINI_API_KEY` on the server. It is not returned by the API and it is not a `VITE_` variable. Live calls also require `AI_ALLOW_LIVE=true`, a model name, both budget limits above the estimated request, and operator-supplied token prices. The default is the local mock. Usage logs record provider, status, and cost status, not the message text. Recommendation cards render validated fields as text. Model markup is not inserted as HTML.

POPIA points that are still outstanding before a production launch: a recorded consent notice, an account-data export, a retention job for old conversations, an operator agreement with the model provider, and a decision on whether conversation text is stored outside South Africa. Child profiles and child photographs are not sent to the stylist. Deleting a conversation removes its messages. Usage totals remain for cost accounting.

## Audit constraints observed

No customer photograph was uploaded. No external AI credential was used for a live generation. `npm run clean` was not run.

## QA isolation, 20 October 2026

The browser suite starts its own API with an absolute `API_DATA_DIR` under the system temporary directory. A relative `API_DATA_DIR` is rejected. An absolute `API_DATA_DIR` is honoured on Render as well so a persistent disk mount path (for example `/var/data`) can be configured; operators must not point production at a disposable path. The Playwright process forces `AI_PROVIDER=mock`, `AI_ALLOW_LIVE=false`, and `AI_MAX_BUDGET_USD=0`. It copies the parent environment first and then sets those values. The existing listeners on ports 3000 and 4331 were not used.

In Chrome, a second account did not see the first account's wardrobe piece, family profile name, or saved beauty look. That is narrower than the API isolation tests, which also passed in this session for profiles, media, wardrobe, family, beauty, and stylist conversations. Browser checks for a wrong password, duplicate registration, a missing API, and an expired session were not run.

The production client bundle was scanned for common provider-key prefixes and variable names. None were present. Cookie `Secure` is still limited to Render mode, and local development remains HTTP. Email verification, password recovery, export, and retention are unchanged and still required before a public deployment.

## Membership accounting, 21 October 2026

Customer sessions cannot assign a plan or grant credits. `POST /api/entitlements` and `POST /api/credits/allocate` return 403. Operator routes require `Authorization: Bearer` matching `API_ADMIN_TOKEN`. A missing token returns 503. A wrong token returns 401. A customer cookie is not treated as an operator credential. Assignment, allocation, adjustment, and refund write an audit event. The audit payload records the account id, plan, status, and amount. It does not record a card number, because no card is collected.

Credit amounts are integers. A hold that would make `SUM(delta)` negative is rejected. The same idempotency key does not post a second delta. A second settlement of a consumed operation is a duplicate. An unknown operation stays held until an operator sets `confirmNotBillable`. One account's credit read does not return another account's rows.

The Playwright config sets a local admin token only for the isolated test API. It is not a production credential. The free entitlement created at registration cannot start a live model call. Preview still writes browser demonstration state and does not call the assignment route. Raw payment details are not stored. Provider credentials remain server-side and were not used.

## Privacy controls, 21 October 2026

Optional consent history defaults to withdrawn. Export and deletion require the current password in addition to the session and CSRF token. Export archives live under a private exports directory, expire, and are not public. Deletion removes personal tables and media files, revokes sessions, and anonymises the email. Credit ledger, provider costs, AI usage, audit, and consent history may remain on a tombstone user id until retention is approved. Destructive retention cleanup stays off unless `API_RETENTION_CLEANUP_ENABLED=true`. Browser demonstration localStorage is separate; clearing it does not delete the server account. These controls are technical safeguards, not a POPIA compliance claim.

## Production infrastructure hardening, 21 October 2026

Staging and production profiles require an `https://` public origin, Secure cookies, an admin token of at least 20 characters, and non-localhost allowed origins. `AI_ALLOW_LIVE=true` and `PAYMENTS_ENABLED=true` are refused on those profiles in this revision. Production also refuses retention cleanup without `API_RETENTION_CLEANUP_ACK=i-understand-destructive-cleanup`. Structured logs redact sensitive field names. `/api/health` is liveness only; `/api/ready` checks the database without returning filesystem paths. SQLite backups use the `node:sqlite` backup API with checksum manifests; automatic prune is disabled. The Free Render filesystem remains ephemeral — durable private data on that plan is still unsafe. Nothing was pushed or deployed in this pass.

## Email verification and password recovery, 21 October 2026

Verification and reset tokens are random, hashed at rest, single-use, and expiring. Password reset responses do not reveal whether an email is registered. Successful reset deletes all sessions for that user. Tokens are not written to `localStorage` and are stripped from the URL after handling. The development mailbox is loopback-only and refused on staging/production. No live transactional provider is configured. Existing accounts are not auto-verified. Optional `API_REQUIRE_EMAIL_VERIFIED` can gate export and deletion after an approved rollout.

## Release-candidate security note, 21 October 2026

No new public surfaces were added in the RC prep pass. Lazy-loaded hubs do not change authz. Navigation restore uses `sessionStorage` for tab ids only (no tokens). Staging must keep `EMAIL_CAPTURE_ENABLED` false, labs private, and live AI/payments off. Photograph onboarding still does not upload to private media—treat as pending, not as secured customer photographs.
