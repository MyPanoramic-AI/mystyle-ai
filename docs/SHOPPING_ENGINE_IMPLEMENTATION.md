# Shopping engine implementation

Status: local foundation. **VERIFIED LIVE retailer integrations: 0.** The consumer Shop screen is unchanged. The FASHN lab is unchanged.

## Location

- Code: `server/shopping/`
- Database file: `server/shopping/private/catalogue.sqlite` (gitignored)
- Test page: `http://127.0.0.1:4321/`
- Start: `npm run shopping-lab`
- Tests: `npm run test:shopping`
- Typecheck: `npm run lint:shopping`

The process binds only to `127.0.0.1` or `localhost`. `SHOPPING_LAB_TOKEN` lives in `server/shopping/.env`, which Git ignores. The example file has an empty placeholder.

## What is real

| Piece | State |
| --- | --- |
| Normalised SQLite catalogue | WORKING |
| JSON and CSV import | WORKING, from request body only |
| Mock connectors `demo-atelier` and `demo-outlet` | WORKING MOCK |
| Search, filters, price sort, pagination | WORKING on the internal fixtures |
| Size labels | WORKING. Cross-retailer conversion is not claimed |
| GTIN exact match and textual similarity | WORKING |
| Price observations and stale warning | WORKING |
| Thirteen researched retailers | BLOCKED. They return no products |
| External feed download | Refused |
| Consumer Shop UI | Unchanged demonstration catalogue of 32 products |

## Connector contract

Each connector exposes an id, label, mode (`mock` or `blocked`), limitations, `listProducts()`, and `getProduct()`. Missing source fields stay null and the API returns `{ "status": "unavailable", "reason": "..." }`. The lab does not turn a missing availability flag into `in_stock`, and it does not invent a price.

Blocked connectors answer with an empty product list and the research blocker. A connector sync of a blocked id is rejected. A developer can still submit a JSON or CSV body for a later approved file. That upload does not contact the retailer. Rows marked `licensed` are not described as verified live.

## Data model

SQLite tables: `products`, `variants`, `product_images`, `price_observations`, `source_payloads`, `import_runs`, `import_errors`.

Prices are integer cents plus a currency code. Rand display is only for `ZAR`. Another currency is returned with a note that it was not converted and that shipping and import costs are absent. A discount percent is calculated only when the source sets `saleStatus` to `verified_sale` and supplies a higher original price.

Freshness is `fresh`, `stale`, or `unknown` from `verifiedAt` and `SHOPPING_FRESH_HOURS` (default 24). A stale price carries the warning "Potentially stale."

Original retailer size labels are kept. `SA` and `UK` numeric labels and alpha labels (`XS`–`XL`) are labelled inside their own system. They are not converted into each other. Shoe sizes keep the stated system and are marked uncertain for any cross-system reading. No result claims a physical fit.

## Search

`parseSearch` reads colour, category, audience, size, and `under R` / `over R` amounts without a language model. A city phrase adds a note that store stock and delivery were not supplied. Price bounds that came from an `R` amount apply only to `ZAR` rows.

Examples that resolve against the demo fixtures:

- "Black evening dresses under R1,500."
- "Women's white sneakers size 6."
- "Men's navy formal shirts under R800."
- "Wedding guest outfits under R2,000."
- "Winter jackets in Cape Town." The Cape Town note is attached, and the jacket's availability stays unavailable.

Structured overrides are accepted for category, colour, size, retailer, brand, availability, sale status, price, sort, and page. An AI stylist can send those fields later. Sort is relevance, `price_asc`, or `price_desc`. Non-ZAR rows are kept out of the rand price order.

## Matching

Exact means a shared GTIN. Overlapping titles in the same category and colour are `similar`, with an explicit note that resemblance is not identity. Same brand and category with another colour is an alternative colour. A lower same-currency price in the category is a budget alternative, not the same item.

## Import

JSON arrays and CSV files use one normaliser. Validation errors are stored on the import run. Valid rows commit together. A snapshot removes products only when every row validated. A corrupt snapshot or an unparsable file leaves the previous catalogue in place. Price history grows only when a supplied price changes. The server rejects `url` and `feedUrl` fields.

## HTTP

| Method | Path | Auth |
| --- | --- | --- |
| GET | `/api/health` | No |
| GET | `/` | No |
| GET | `/api/connectors` | Bearer lab token |
| GET | `/api/products` | Bearer lab token |
| GET | `/api/products/:id` | Bearer lab token |
| GET | `/api/imports` | Bearer lab token |
| POST | `/api/imports` | Bearer lab token |

Missing or wrong tokens receive HTTP 401 when a token is configured. SQL uses bound parameters. Image URLs are stored and are not fetched by the server.

## Security

Retailer credentials are not stored because no live connector exists. The lab token is server-side. Logs from the process do not print it. The browser test page keeps the token in `sessionStorage` and does not put it in the query string. The service does not call FASHN and does not start a public listener.
