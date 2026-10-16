# South African Retailer Integration Plan

Status: investigation and experiment design. No retailer feed was connected. No scraper was built. No price in the current shop is a verified live price.

Audit date: 16 October 2026.

## What the product must prove

1. Search genuine South African clothing listings.
2. Identify real clothing products.
3. Retrieve product images the licence allows us to display.
4. Retrieve the current advertised price where the source provides it.
5. Distinguish a similar product from the same product.
6. Read size availability where the source provides it.
7. Store the product URL.
8. Store the source name and the time the record was last verified.
9. Compare comparable offers when more than one licensed source has the same product.
10. Return no result rather than an invented product or an invented price.

The current shop fails items 1 through 10 by design. `src/data/shopData.ts` contains 32 demonstration products. Prices use `demoPriceZar`. The shop footer tells the user the listings are mockups. That labelling must remain until a record comes from a licensed source.

## What was not assumed

- Google Merchant API was not treated as a search engine over all South African retailers. Public Merchant API documentation describes management of the caller's own Merchant Center account: product uploads, quotas, and account data. It does not grant MyStyle AI a copy of Woolworths, Superbalist, or TFG catalogues.
- The Content API for Shopping is documented by Google as deprecated in favour of Merchant API. Neither one was integrated.
- Uncontrolled scraping of retailer websites is not the default design. It breaks easily, it often conflicts with site terms, and it is a poor base for a commercial price claim.
- Presence of a brand name in `src/types/shop.ts` is not evidence of an integration. Those names are Woolworths, Mr Price, Superbalist, Bash, Cotton On, H&M, Zara, and Takealot.
- `CURSOR_HANDOVER.md` also names Foschini and Truworths. The shop type does not. Public Bash material describes TFG brands, including Foschini, moving onto Bash. That is context for who to approach. It is not an active feed.

## Integration methods worth testing, in order

### 1. Affiliate or publisher product feeds

Awin's public publisher documentation describes product feeds that an approved publisher can download for advertisers they are allowed to promote, including CSV and a Google-format JSONL feed (`https://api.awin.com/publishers/{publisherId}/awinfeeds/download/{advertiserId}-retail-{locale}.jsonl`). Access depends on a publisher account, a product-feed key, and advertiser approval.

This is the preferred first experiment because the feed is a licensed catalogue with product URLs, images, and prices when the advertiser fills those fields.

Not established in this audit:

- Whether MyStyle AI has or can get an Awin (or equivalent) publisher account.
- Which of the named South African retailers are advertisers on that network.
- Whether their South African feeds include size-level availability, GTIN or other identity keys, and image rights that allow virtual try-on.

Those three facts are the Phase 3 experiment. They are not assumed to be true.

Other networks can be checked the same way. A retailer that is absent from every approved network stays unavailable in the product.

### 2. Direct retailer or marketplace APIs

Use these only where the contract matches consumer search, not seller-side listing management.

Observed public material that does **not** yet qualify as a MyStyle AI integration:

- Takealot's own seller tooling is for merchants managing their listings. A third-party "Takealot API" wrapper was found in search results. It was not reviewed as a licensed source and is not approved.
- Wherehouse's public API material describes sending a seller's own products onto marketplaces. That is the opposite direction.
- Proactive Clothing / Mass Supply publishes a distributor product API for their wholesale catalogue. That could be relevant only if the commercial relationship is a wholesale catalogue, which is not the current consumer-shop brief.

No official public product-search API for Woolworths, Superbalist, Bash, Mr Price, Cotton On, H&M, or Zara was confirmed in this pass. Absence from this audit is not proof that a private partner API cannot exist. It is proof that this repository does not have one.

### 3. Merchant feeds the retailer chooses to give us

A retailer can supply a Google Merchant-format feed or a CSV under a written agreement. That is a direct feed, not use of Google's API as a universal index. Store the file's arrival time as `verifiedAt` for every row in that drop, and expire rows when the next drop does not contain them.

### 4. Methods that stay off the default path

- Browser-side fetching of retailer HTML.
- Headless scraping as the primary pipeline.
- Asking a language model for "the current Woolworths price".

A narrowly authorised, rate-limited fetch of a single product page could be a later verification aid for a URL we already hold from a feed. It is not the catalogue.

## Data rules

Every stored offer needs:

- `source` (network or retailer name, plus feed id)
- `sourceProductId`
- `productUrl`
- `title`, `brand`, `category`
- `imageUrl` only if the feed licence allows display
- `priceZar` or `priceStatus: "unknown"`
- `currency: "ZAR"`
- `sizes` when the feed has them, otherwise `sizeStatus: "unspecified"`
- `verifiedAt`
- `identityKey` when a GTIN, EAN, or retailer SKU exists

Matching:

- Same `identityKey` means the same product and can be compared on price.
- Same title and different identity keys, or missing keys, are **similar**, never merged into one price comparison.
- A missing size list is not "all sizes in stock".

The shop UI already has a `RetailerDataQualityState` type with values `Verified Offer`, `Price Needs Confirmation`, `Similar Item`, `Demo Listing`, and `Unavailable`. Production should use those states literally. Every current row is a `Demo Listing`.

## Phase 3 experiment

1. List the eight retailers encoded in `SouthAfricanRetailer`.
2. For each, record whether an affiliate programme, a direct feed, or a partner API can be applied for. Use the network's own advertiser directory. Do not mark a retailer as joined because a blog or a third-party scraper claims to read the site.
3. If one feed can be downloaded under a test publisher account, ingest a small sample (for example 50 clothing rows) into a SQLite table.
4. Manually open 10 product URLs and compare title, image, and price with the feed. Record mismatches. Record the fetch time.
5. Attempt to group identical products only where an identity key exists. Count how many rows lack that key.
6. Write the outcome into `CURSOR_PROGRESS.md`, including retailers that have no lawful feed. Those retailers remain unavailable.

No sample was ingested during this audit, so every retailer is currently **unavailable as a live source**.

## 16 October 2026 foundation

`server/shopping` is a separate localhost service. It searches a SQLite catalogue seeded only with DEMO fixtures. The thirteen researched retailers are registered as blocked connectors and return no products. Details, the source matrix, and the test record are in `SA_RETAILER_FEASIBILITY_MATRIX.md`, `SHOPPING_ENGINE_IMPLEMENTATION.md`, and `SHOPPING_ENGINE_TEST_REPORT.md`.

The 32-product React catalogue in `src/data/shopData.ts` is unchanged. Verified live integrations remain zero.

## How this connects to try-on later

A shop result can be sent to try-on only when the feed licence, or a separate image licence, allows that product image to be transmitted to the try-on provider. Editorial photographs already in `src/assets/images/` are not a substitute catalogue.
