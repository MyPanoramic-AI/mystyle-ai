# Shopping wishlist integration

Date: 22 October 2026.

## Status

Consumer Shop remains a **demonstration catalogue**. No verified retailer feed is connected.

Authenticated customers persist wishlist rows through `/api/saved-products`:

- `retailerSource`: `mystyle_demo_catalogue` (demonstration)
- `externalProductId`: local product id
- Unique per `(user_id, retailer_source, external_product_id)`
- Responses label demonstration sources and do not invent live price or stock

## Client

`savedProductsService` mirrors `savedLooksService`:

- Account mode: `useAccount` binds list/save/remove to the API
- Demo mode: localStorage only (starter seeds remain demo-only)

Unavailable catalogue ids still appear as removable references. Cross-account access is owner-scoped on the API.

## Not done

Live retailer identifiers, availability checks, and purchase flows remain external-integration pending.
