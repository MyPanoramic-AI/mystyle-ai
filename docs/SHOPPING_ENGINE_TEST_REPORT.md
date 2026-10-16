# Shopping engine test report

Date: 16 October 2026.

No retailer website was called. No paid API was called. The FASHN lab was not modified. The React shop was not modified.

## Shopping tests

`npm run test:shopping` — exit 0.

| Result | Count |
| --- | --- |
| Passed | 15 |
| Failed | 0 |

Covered behaviour:

- Alpha, SA, and shoe size labels, including the refusal to treat size 6 as 16 or S as XS.
- Missing price and missing availability stay empty.
- Invalid price, availability, and currency are rejected.
- The five sample sentences return the expected demo fixtures, including the Cape Town stock note.
- Price sort, pagination, stale warning, and the exclusion of a USD fixture from an "under R" filter.
- A quote in the search text does not return the whole table.
- Price updates append an observation. A corrupt snapshot does not delete the previous row. CSV import keeps a quoted comma and a size label. An unparsable JSON feed is audited without deleting rows.
- A shared GTIN is an exact match. A similar title is not described as the same item.
- Health reports zero verified live connectors. Missing and wrong tokens are HTTP 401. A remote feed URL is refused. A blocked connector sync is HTTP 409. An authenticated mock sync returns the demo dress.

## Other commands

| Command | Result |
| --- | --- |
| `npm run lint:shopping` | Exit 0 |
| `npm run lint` | Exit 0 |
| `npx tsc --noEmit --strict` | Exit 0 |
| `npm run build` | Exit 0. Existing Vite chunk-size warning and `__dirname` native-config warning |
| `npm run test:tryon` | Exit 0. 16 passed, 0 failed |

After those commands, `npm run shopping-lab` listened on `http://127.0.0.1:4321`. Health returned `verifiedLiveConnectors: 0`, `mockConnectors: 2`, and `blockedConnectors: 13`. A request without a token and a request with the wrong token returned HTTP 401. An authenticated search for "Black evening dresses under R1,500" returned 3 DEMO rows.

## Not claimed

The demo prices are fixtures. They are not Woolworths, Superbalist, Bash, or any other retailer prices. Human review of a live try-on image did not happen in this phase. Phase 2 remains awaiting live validation.
