# Final customer journey report

Date: 22 October 2026. Synthetic adults only. Live AI, FASHN, retailers, payments, and live email remain off.

## Coverage map

| Journey | Status | Suite evidence |
| --- | --- | --- |
| Registration / login / logout / refresh session | Verified | `customer-journeys`, auth failures |
| Email verification + password recovery | Verified | `email-security` |
| Onboarding skip / walk | Verified | `customer-journeys` |
| Onboarding private photographs | Verified | `customer-integrations` |
| Profile edit | Verified | `profile` |
| Wardrobe + outfits + planner | Verified | `wardrobe`, records journey |
| Outfit date reschedule | Verified | wardrobe UI + API `PATCH` |
| Discover save/remove | Verified | `discover-beauty-family` |
| Family profiles + event | Verified | `discover-beauty-family`, records |
| Beauty save/link/delete | Verified | `discover-beauty-family` |
| Stylist mock chat | Verified | `shop-stylist-membership`, journeys |
| Shop demo labelling + account wishlist | Verified | shop specs + `customer-integrations` |
| Try On inactive demo | Verified | shop-stylist / journeys |
| Membership preview (no payment) | Verified | membership specs; account entitlement |
| Consent / export / deletion | Verified | `privacy` |
| Cross-account isolation | Verified | API + `customer-integrations` |
| Navigation restore after refresh | Verified | `navigation-restore` |
| Overflow 320–1440 | Verified | `visual-accessibility` |
| Axe primary modules | Recorded | counts vary by screen — not a WCAG claim |

## Labels that must remain

- Shop and Discover are not verified retailer inventory.  
- Try On does not complete a live fitting.  
- Stylist mock replies are demonstration when live is off.  
- Membership Preview does not purchase.  
- Private photo storage does not authorise external AI.  
- Email capture is not production delivery.

## Documented journey gaps (not failures of existing tests)

- Inner sub-tabs (e.g. Beauty nails vs makeup) are not all restored on refresh—only shell tab/subpage.  
- Live provider quality untested by design.
