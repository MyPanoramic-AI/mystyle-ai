# Performance verification — Master QA

Date: 22 October 2026.

## Frontend bundle (production `npm run build`)

| Asset | Size | Gzip |
| --- | --- | --- |
| `index-*.js` (main) | 644.62 kB | 171.43 kB |
| `MembershipHubScreen-*.js` | 84.25 kB | 16.25 kB |
| `WardrobeScreen-*.js` | 80.81 kB | 16.01 kB |
| `FamilyStylingScreen-*.js` | 50.58 kB | 10.60 kB |
| `DiscoverScreen-*.js` | 41.61 kB | 11.06 kB |
| `BeautyStudioScreen-*.js` | 38.88 kB | 8.02 kB |
| `index-*.css` | 89.51 kB | 13.66 kB |

Hub routes remain lazy-loaded (Prompt 15). Main chunk still exceeds the Vite 500 kB advisory.

## Images

Editorial JPEGs in `dist/assets` remain approximately **605 kB–989 kB** each. No compression pass in this Master QA (would change visual assets; out of “no redesign” preference unless approved).

## Backend

- SQLite API tests for wardrobe, family, beauty, membership, and privacy completed in seconds on isolated temp databases.
- No production load test was run.
- Concurrent credit reservation test continues to pass (double-spend blocked).

## Changes this pass

No performance-oriented refactors. Bundle measurement recorded after functional fixes only.

## Open

- Further route-level splitting of the main shell.
- Image optimisation / responsive `srcset` before public traffic (K3).
