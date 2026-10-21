# Backend implementation

Date: 16 October 2026. This is the local account API. It is not a public deployment and it is not connected to the React screens, the FASHN lab, or the shopping lab.

## What runs

- Process: `npm run api`
- Bind: `127.0.0.1:4331` unless `API_HOST` and `API_PORT` override it. Any other host is rejected.
- Database: `node:sqlite` at `server/api/private/mystyle.sqlite`. That directory is gitignored except `.gitkeep`.
- Media: `server/api/private/media`, UUID file names, not served as static files.
- Configuration: optional `server/api/.env`. Placeholders live in `.env.example`. No secret is required to start. `API_ADMIN_TOKEN`, when set, must be at least 20 characters and must not be committed.

## What it does

- Registers an adult account, signs in, signs out, and checks the session.
- Stores a style profile, optional measurements, and preference flags for the signed-in user.
- Stores wardrobe items, saved looks, outfit plans, and saved product references (retailer source and external id only). Signed-in wardrobe routes are documented in `WARDROBE_INTEGRATION.md`. Live model calls stay off.
- Stores a family profile and family event plan for the signed-in adult. A dependent record cannot sign in or be an editor. Photographs and dates of birth are refused. See `FAMILY_STYLING_INTEGRATION.md`.
- Stores optional beauty preferences and saved beauty inspiration for the signed-in adult. Photographs and health details are refused. External beauty generation stays disconnected. See `BEAUTY_STUDIO_INTEGRATION.md`.
- Accepts JPEG, PNG, and WebP uploads, returns them only to the owner, and deletes the file.
- Gives a new account a free entitlement and a zero credit balance. The free row is not a paid subscription and does not start a live model call.
- Records test credits, reservations, and provider-cost rows when an operator bearer token is configured. Customers cannot grant credits or assign Personal or Family.
- Reports billing and credits as `not_connected`. No payment provider is called. Stylist, try-on, shopping, and beauty stay disconnected from this ledger.
- Records optional consent history, authenticated account export archives, account deletion with password confirmation, and retention dry-runs. Destructive retention cleanup stays off unless `API_RETENTION_CLEANUP_ENABLED=true`.

## What it does not do

- The React account, onboarding, and style profile screens can use it through the Vite `/api` proxy. See `CUSTOMER_ACCOUNT_INTEGRATION.md`.
- It does not read `localStorage` itself. The browser imports a style profile only after an explicit choice.
- It does not send photographs to FASHN or any other provider.
- It does not import the demonstration family or child records.
- It does not verify email or reset passwords. Those flows are unavailable.
- It does not take payment.

## Routes

| Method and path | Auth | Result |
| --- | --- | --- |
| `GET /api/health` | No | Liveness (`status: live`) |
| `GET /api/ready` | No | Readiness and database `up` / `unavailable` |
| `POST /api/auth/register` | No | Creates an account and sets the session cookie |
| `POST /api/auth/login` | No | Sets the session cookie |
| `POST /api/auth/logout` | Session and CSRF | Deletes the session |
| `GET /api/auth/session` | Session | Returns the user id, CSRF token, and expiry |
| `GET` and `PUT /api/profile` | Session; PUT also CSRF | Profile and optional measurements |
| `GET` and `PUT /api/preferences` | Session; PUT also CSRF | Privacy, notifications, and consent flags |
| `GET` and `POST /api/family`, `GET`, `PATCH`, and `DELETE /api/family/:id` | Session; writes also CSRF | Owner-only family profiles |
| `GET` and `POST /api/family-events`, `GET`, `PATCH`, and `DELETE /api/family-events/:id` | Session; writes also CSRF | Owner-only planned family events |
| `GET` and `PUT /api/beauty-preferences` | Session; PUT also CSRF | Optional beauty preferences. No health data |
| `GET` and `POST /api/beauty-looks`, `GET`, `PATCH`, and `DELETE /api/beauty-looks/:id` | Session; writes also CSRF | Owner-only saved inspiration looks. `GET` accepts `category` and `q` |
| `POST /api/beauty-looks/:id/links`, `DELETE /api/beauty-looks/:id/links/:linkId` | Session and CSRF | Link a look to an outfit or plan owned by the same account |
| `GET` and `POST /api/wardrobe`, `GET /api/wardrobe/:id` | Session; POST also CSRF | Owner-only wardrobe items |
| `GET` and `POST /api/looks`, `GET /api/looks/:id` | Session; POST also CSRF | Looks made from the owner's wardrobe |
| `GET` and `POST /api/saved-products`, `DELETE /api/saved-products/:id` | Session; writes also CSRF | Product references without prices |
| `POST /api/media`, `GET` and `DELETE /api/media/:id`, `POST /api/media/cleanup` | Session; writes also CSRF | Private images |
| `GET /api/plans` | Session | Provisional FREE, PERSONAL, and FAMILY definitions. `paymentsEnabled` is false |
| `GET /api/entitlements` | Session | The account's current entitlement. `paid` is false |
| `POST /api/entitlements` | Session and CSRF | 403. A customer cannot assign a plan |
| `GET /api/credits` and `GET /api/credits/history` | Session | Integer test-credit balance and ledger rows for that account |
| `POST /api/credits/allocate` | Session and CSRF | 403. A customer cannot grant credits |
| `GET /api/usage/summary` | Session | That account's provider-cost rows. Amounts stay null when the provider did not report a cost |
| `GET /api/integrations` | Session | Billing and credits remain `not_connected` |
| `GET /api/privacy/notice`, `GET` and `POST /api/privacy/consent` | Session; POST also CSRF | Draft notice placeholder and versioned consent history. Defaults off |
| `GET /api/privacy/media` | Session | Owned private photographs. External photo AI remains inactive |
| `POST /api/privacy/export`, `GET /api/privacy/export/:id`, `GET /api/privacy/export/:id/download` | Session; POST also CSRF and password | Private ZIP export. Expires. Secrets excluded |
| `GET /api/privacy/deletion`, `POST .../start`, `.../cancel`, `.../confirm` | Session; writes CSRF; confirm needs password | Account deletion workflow |
| `GET /api/privacy/retention/preview` | Session | Dry-run preview for the signed-in account |
| `GET /api/admin/audit` | Admin bearer | 503 when the admin token is unset |
| `GET /api/admin/accounts`, `GET /api/admin/usage`, `GET /api/admin/credits/reservations`, `GET /api/admin/credits/reconcile` | Admin bearer | Operator reads. No customer session is accepted as admin |
| `POST /api/admin/retention/dry-run`, `GET /api/admin/retention/policies`, `POST /api/admin/retention/cleanup`, `POST /api/admin/exports/expire` | Admin bearer | Retention reporting. Cleanup requires `API_RETENTION_CLEANUP_ENABLED=true` |
| `POST /api/admin/entitlements` | Admin bearer | Test assignment. Not a payment |
| `POST /api/admin/credits/allocate`, `reserve`, `settle`, `release`, `adjust`, `refund`, `expire`, `mock` | Admin bearer | Ledger mutations. Mock operations do not call a provider |
| `POST /api/admin/billing/run` and `POST /api/admin/billing/policy` | Admin bearer | Period run and policy flags. Paid allocation stays off unless a test sets it |

## Startup check

`GET /api/health` returns liveness only (`ok`, `status: live`) and does not prove database readiness. `GET /api/ready` returns `database: up` when SQLite answers, or 503 with `database: unavailable` without filesystem paths.
