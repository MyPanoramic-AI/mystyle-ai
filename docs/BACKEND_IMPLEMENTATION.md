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
- Stores a minimal family record owned by the account. A dependent record cannot be an editor. No photograph is attached.
- Accepts JPEG, PNG, and WebP uploads, returns them only to the owner, and deletes the file.
- Returns empty entitlements and a zero credit balance. Nothing in this process can purchase or grant paid credits.
- Reports integration boundaries as `not_connected` for stylist, try-on, shopping, beauty, billing, and credits.

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
| `GET /api/health` | No | Bind host and database status |
| `POST /api/auth/register` | No | Creates an account and sets the session cookie |
| `POST /api/auth/login` | No | Sets the session cookie |
| `POST /api/auth/logout` | Session and CSRF | Deletes the session |
| `GET /api/auth/session` | Session | Returns the user id, CSRF token, and expiry |
| `GET` and `PUT /api/profile` | Session; PUT also CSRF | Profile and optional measurements |
| `GET` and `PUT /api/preferences` | Session; PUT also CSRF | Privacy, notifications, and consent flags |
| `GET` and `POST /api/family`, `GET` and `PATCH /api/family/:id` | Session; writes also CSRF | Owner-only family records |
| `GET` and `POST /api/wardrobe`, `GET /api/wardrobe/:id` | Session; POST also CSRF | Owner-only wardrobe items |
| `GET` and `POST /api/looks`, `GET /api/looks/:id` | Session; POST also CSRF | Looks made from the owner's wardrobe |
| `GET` and `POST /api/saved-products`, `DELETE /api/saved-products/:id` | Session; writes also CSRF | Product references without prices |
| `POST /api/media`, `GET` and `DELETE /api/media/:id`, `POST /api/media/cleanup` | Session; writes also CSRF | Private images |
| `GET /api/entitlements` | Session | Always an empty list in this phase |
| `GET /api/credits` | Session | Balance from the ledger, which stays empty |
| `GET /api/integrations` | Session | All boundaries `not_connected` |
| `GET /api/admin/audit` | Admin bearer | 503 when the admin token is unset |

## Startup check

`GET /api/health` returns `ok`, the bind host, and `database: up`. A database error returns 503 and the words `database: unavailable`.
