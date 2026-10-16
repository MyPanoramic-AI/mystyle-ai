# Proposed Backend Architecture

Status: `server/api` now implements the local account, profile, media, wardrobe, and ledger foundation on `127.0.0.1:4331`. It is not connected to the React app. Try-on remains the separate lab on port 4317. Shopping remains the separate lab on port 4321 and is not a live retailer integration. See `BACKEND_IMPLEMENTATION.md`.

The React and Vite frontend stays. The backend is a modular Node.js service that the current `src/services/` modules can call later. SQLite is the database for the controlled proof of concept. PostgreSQL, PocketBase, and a mobile client are not part of this stage. The schema and HTTP contracts should still be ordinary enough to move to another SQL database and a future mobile client without rewriting the product rules.

`CURSOR_HANDOVER.md` suggests PostgreSQL, Firebase or Supabase, and scrapers. Those are not the proof-of-concept choices.

## Process layout

One Node.js process is enough at the start.

| Module | Responsibility |
| --- | --- |
| `http` | Express application, JSON routes, authentication middleware, error shape |
| `auth` | Adult account registration, session, password or one-time code |
| `profiles` | Style profile and measurements for the signed-in adult |
| `media` | Private photograph storage, signed read URLs, deletion |
| `jobs` | Background queue for try-on and other slow image work |
| `ai` | Coordinator and provider adapters. See `AI_INTEGRATION_PLAN.md` |
| `tryon` | Virtual try-on jobs, provider calls, cost records |
| `shopping` | Licensed catalogue search and price verification. See `SA_RETAILER_INTEGRATION_PLAN.md` |
| `wardrobe` | Owned garments and outfits |
| `beauty` | Saved beauty preferences. Generative beauty is later and separate |
| `billing` | Plan entitlements and credit ledger. No live payment capture in the first backend phase |
| `admin` | Operator view of jobs, cost, and failed generations |
| `db` | SQLite access through a small repository layer, not SQL scattered in routes |

Express is already a dependency and is unused. The later server should be a new file such as `server/index.ts`, started with a new script. Do not revive the export's missing `server.js` by bolting routes onto the Vite dev server.

## Why SQLite first

The proof of concept needs one operator, invited adult users, and a full record of profiles, jobs, and costs. SQLite gives transactions and a single file backup without operating a separate database server. Repositories should use parameterised SQL and return plain objects. A later move to PostgreSQL then changes the driver and a small amount of SQL dialect, not the HTTP API or the React screens.

Constraints to accept now:

- One application instance writes to the database file.
- Enable WAL mode.
- Store the database file outside the web root and outside Git.
- Photographs do not go in SQLite as blobs. The database stores the storage key, content type, byte size, and checksum.

## Private files

Local disk is acceptable for the proof of concept if the directory is outside `public/` and the Express static host does not serve it. Each object key is random. Reads go through an authenticated route or a short-lived signed URL minted by the API.

The storage interface should be a small port (`put`, `get`, `delete`) so a later object store can replace the disk adapter.

## Background jobs

Virtual try-on is too slow and too costly to run inside a request thread without a status record. A `jobs` table plus a worker loop in the same Node.js process is enough. The client polls `GET /api/jobs/:id` or receives status from a later SSE stream.

Each job stores status (`queued`, `running`, `succeeded`, `failed`), provider, model, started time, finished time, error code, and cost. Retries are explicit and limited. A failed provider call must not be reported as a successful image.

## Proposed HTTP surface

All routes are under `/api`. The browser never receives provider credentials. Shapes below are contracts to implement later, not live endpoints.

### Session

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/session`

### Profile

- `GET /api/profile`
- `PUT /api/profile`
- `DELETE /api/profile` for account deletion, which must also delete photographs and job outputs

### Media

- `POST /api/media` for an adult's own photograph
- `GET /api/media/:id` authenticated
- `DELETE /api/media/:id`

### Try-on

- `POST /api/tryon/jobs` with `{ personMediaId, garmentMediaId | productId }`
- `GET /api/tryon/jobs/:id`
- `GET /api/tryon/jobs/:id/result`

The server checks that both images belong to the caller, that the account is an adult, that credits and the spend ceiling allow the call, and that the garment reference is either the user's upload or a product image the licence allows us to send to the provider.

### Shopping

- `GET /api/shopping/search?q=`
- `GET /api/shopping/products/:id`
- `POST /api/shopping/products/:id/verify` to refresh price and availability from the licensed source

The response fields for an offer are specified in `DATA_MODEL_PLAN.md`. If the source has no price, the API returns `priceStatus: "unknown"`. It does not estimate one.

### Wardrobe, beauty, conversations

- `GET/POST/PATCH/DELETE /api/wardrobe/items`
- `GET/POST /api/wardrobe/outfits`
- `GET/POST /api/conversations` and `POST /api/conversations/:id/messages`
- Beauty catalogue reads can remain static until a real beauty generator exists. Saved looks become ` /api/beauty/looks`.

### Entitlements and admin

- `GET /api/entitlements`
- `GET /api/credits/ledger`
- `GET /api/admin/jobs` and `GET /api/admin/costs` for operator accounts only

Payment-provider webhooks are a later phase. Until then, entitlements are assigned manually for pilot accounts.

## Frontend integration rule

Keep the React components. Replace function bodies inside `src/services/` so screens keep their props. Add a single API client that sends the session cookie and surfaces server errors. Do not call provider URLs from the browser.

Demo modules stay available behind an explicit development flag until the real service for that module has passed its acceptance tests. Removing the mock data files is not part of the first backend milestone.

## Operational controls

- Structured logs with request id and account id. No image payloads, passwords, or raw provider keys.
- Per-account rate limit and a process-wide daily spend limit.
- Health route that checks SQLite and the media directory without leaking paths.
- Backups of the SQLite file and the media directory before any pilot.

## Migration path

Mobile clients, when they exist, should use the same `/api` contracts. Authentication can move from a cookie to a bearer token behind the same auth module. The database can move from SQLite to PostgreSQL behind the repository interfaces. Provider adapters can be replaced without changing the try-on job contract.

Those moves are not scheduled in the proof of concept.

## Account API, 16 October 2026

`server/api` is a third localhost process. It owns users, sessions, profiles, preferences, private media, family relationship records, wardrobe items, saved looks, saved product references, empty entitlements, and a credit ledger that no route can increase. It does not call FASHN, a retailer, a model, or a payment provider. The consumer screens still use `localStorage`.

## Shopping lab, 16 October 2026

The shopping module is no longer only a proposal. `server/shopping` is its own Express process on `127.0.0.1:4321`, with SQLite in a gitignored file. It is not mounted on the Vite app and it does not replace the future account, media, or try-on modules. Live retailer connectors are not implemented. See `SHOPPING_ENGINE_IMPLEMENTATION.md`.
