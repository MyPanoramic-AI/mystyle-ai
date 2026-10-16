# South African retailer feasibility matrix

Status date: 16 October 2026.

This matrix records what could be verified from official or primary public pages during this session. It is not a list of commercial partners. **Verified live integrations: 0.** No feed was downloaded, no account was created, and no site was scraped for products.

Google Merchant API is not treated as access to these catalogues. Public Merchant API material describes the caller's own Merchant Center account.

Awin's publisher product-feed documentation was not re-fetched: `https://docs.awin.com/docs/product-feeds` returned HTTP 504. Whether any retailer below is an approved Awin advertiser remains **UNVERIFIED**.

| Retailer | Operating | Public developer API | Affiliate programme | Authorised product feed | Commercial partnership | Approved price and stock channel | Photo display permission | Cache permission | Product-page linking | Contract required |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Superbalist | Operating. `superbalist.com` describes a South African online fashion shop, Cape Town head office, and a Cyber Monday 2026 page | Not found | UNVERIFIED | UNVERIFIED | UNVERIFIED | UNVERIFIED | UNVERIFIED | UNVERIFIED | UNVERIFIED | UNVERIFIED. Do not use the public website as a feed |
| Zando | Not operating as its own shop. `https://www.zando.co.za` returned the Bash storefront title. TFG's Bash announcement said the Zando domain was acquired and Bash does not own Zando | Not found | Not applicable while the shop is redirected | Not found | Not found | Not found | Not found | Not found | The old shop is not an independent catalogue | Not a current integration target |
| Bash | Operating. `https://bash.com` returned "Bash: Online Shopping" | Not found | UNVERIFIED | UNVERIFIED | UNVERIFIED | UNVERIFIED | UNVERIFIED | UNVERIFIED | UNVERIFIED | UNVERIFIED |
| Woolworths South Africa | Operating retailer. No official catalogue API page was found | Not found. A third-party wrapper states it is not an official Woolworths API. It was not used | UNVERIFIED | UNVERIFIED | UNVERIFIED | UNVERIFIED | UNVERIFIED | UNVERIFIED | UNVERIFIED | UNVERIFIED |
| Truworths | Operating. `https://www.truworths.co.za` presents online shopping | The public host `truprodapi.truworths.co.za` identifies itself as an eLearning API, not a product catalogue | UNVERIFIED | UNVERIFIED | UNVERIFIED | UNVERIFIED | UNVERIFIED | UNVERIFIED | UNVERIFIED | UNVERIFIED |
| Mr Price | Operating brand. A shopping-centre directory lists `https://www.mrp.com/en_za/`. The homepage itself was not retrieved in this session | Not found | UNVERIFIED | UNVERIFIED | UNVERIFIED | UNVERIFIED | UNVERIFIED | UNVERIFIED | UNVERIFIED | UNVERIFIED |
| The FIX | TFG brand. `https://tfglimited.co.za/our-brands/ladies-and-family/` describes The FIX and lists 219 outlets. Direct fetch of `thefix.co.za` was not completed | Not found | UNVERIFIED | UNVERIFIED | UNVERIFIED | UNVERIFIED | UNVERIFIED | UNVERIFIED | UNVERIFIED | UNVERIFIED |
| Foschini | TFG brand on the same official brand page, with 246 outlets listed | Not found | UNVERIFIED | UNVERIFIED | UNVERIFIED | UNVERIFIED | UNVERIFIED | UNVERIFIED | UNVERIFIED | UNVERIFIED |
| H&M South Africa | International brand with a South African storefront. A South African product feed was not retrieved | H&M Group Integration Tech Hub (`https://portal.api.hmgroup.com/apipage`) requires a signed-in user. No public catalogue contract was visible | A Sovrn marketing page offers an H&M affiliate programme. It does not prove a South African product-feed licence | UNVERIFIED | UNVERIFIED | UNVERIFIED | UNVERIFIED | UNVERIFIED | UNVERIFIED | Likely, for the partner portal. Not accepted |
| Cotton On South Africa | Operating. Cotton On publishes a South African store path. A directory listing at `https://productfeeds.cottonon.com/` includes `googleFeed-cog-za.csv` | Not found as a documented developer API | The page `https://cottonon.com/ZA/affiliates-offers-aus.html` is a consumer offers page, not feed terms | A CSV file is publicly listed. Permission to cache, display, or commercially reuse it was **not** verified, so it was **not** ingested | UNVERIFIED | UNVERIFIED until Cotton On confirms the feed licence | UNVERIFIED | UNVERIFIED | UNVERIFIED | Do not use the open directory without written permission |
| Exact | TFG value brand. The TFG brand page and Exact's own company description name `exact.co.za` / Bash Exact | Not found | UNVERIFIED | UNVERIFIED | UNVERIFIED | UNVERIFIED | UNVERIFIED | UNVERIFIED | UNVERIFIED | UNVERIFIED |
| Legit | A shopping-centre directory lists `https://www.legit.co.za/`. Direct official confirmation was not retrieved, so current operation is **UNVERIFIED** | Not found | UNVERIFIED | UNVERIFIED | UNVERIFIED | UNVERIFIED | UNVERIFIED | UNVERIFIED | UNVERIFIED | UNVERIFIED |
| Pick n Pay Clothing | A shopping-centre directory lists the brand and `pnpclothing.co.za` previously returned a Pick n Pay shopping title. A product API was not found | Not found | UNVERIFIED | UNVERIFIED | UNVERIFIED | UNVERIFIED | UNVERIFIED | UNVERIFIED | UNVERIFIED | UNVERIFIED |

## Classification

| State | Count | Meaning |
| --- | --- | --- |
| VERIFIED LIVE | 0 | An authorised source was called and its rows were checked |
| IMPLEMENTED LIVE | 0 | A real connector exists but has not been verified |
| WORKING MOCK | 2 | `demo-atelier` and `demo-outlet`, labelled DEMO |
| BLOCKED | 13 | The retailers above. The lab lists them and returns no products |

## First two sources to pursue

Do not register, pay, or accept terms until the project owner approves.

1. Written permission from Cotton On for the existing South Africa CSV, including image display, cache duration, and linking rules. If permission is refused, this source stays blocked.
2. A publisher application on one affiliate network, then advertiser approval for two fashion retailers that the network's own directory lists for South Africa. Superbalist and Bash are the first names to check in that directory because both are operating online shops. Their presence on a network is not assumed.

A direct TFG or Woolworths partner feed is the alternative if affiliate directories do not list them. Unofficial scrapers stay out of the design.
