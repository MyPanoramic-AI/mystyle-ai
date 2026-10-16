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

`familyService` writes the child seed profiles as soon as the family module loads in a browser that has no existing key. That is real personal-information-shaped data sitting in a demo, and the pattern must not be copied to a server.

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

The current family UI may remain as a local demonstration until product and legal review decide whether family profiles of children belong in the commercial product at all. Server storage of child profiles is out of scope for the controlled proof of concept. See `POC_SCOPE.md`.

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

## Audit constraints observed

No customer photograph was uploaded. No external AI credential was used. `npm run clean` was not run.
