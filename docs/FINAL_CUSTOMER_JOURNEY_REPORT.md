# Final customer journey report

Date: 21 October 2026. Synthetic adults only. Live AI, FASHN, retailers, payments, and live email remain off.

## Coverage map

| Journey | Status | Suite evidence |
| --- | --- | --- |
| Registration / login / logout / refresh session | Verified | `customer-journeys`, auth failures |
| Email verification + password recovery | Verified | `email-security` |
| Onboarding skip / walk | Verified | `customer-journeys` |
| Profile edit | Verified | `profile` |
| Wardrobe + outfits + planner | Verified | `wardrobe`, records journey |
| Discover save/remove | Verified | `discover-beauty-family` |
| Family profiles + event | Verified | `discover-beauty-family`, records |
| Beauty save/link/delete | Verified | `discover-beauty-family` |
| Stylist mock chat | Verified | `shop-stylist-membership`, journeys |
| Shop demo labelling | Verified | shop specs |
| Try On inactive demo | Verified | shop-stylist / journeys |
| Membership preview (no payment) | Verified | membership specs |
| Consent / export / deletion | Verified | `privacy` |
| Cross-account isolation | Verified | API + selected browser checks |
| Navigation restore after refresh | Verified (this phase) | `navigation-restore` |
| Overflow 320–1440 | Verified | `visual-accessibility` |
| Axe primary modules | Recorded (this phase) | registration 0; home 1; stylist 3; shop 1; try-on 3; profile 4; wardrobe/family/beauty/membership/discover 2 each — not a WCAG claim |

## Labels that must remain

- Shop and Discover are not verified retailer inventory.  
- Try On does not complete a live fitting.  
- Stylist mock replies are demonstration when live is off.  
- Membership Preview does not purchase.  
- Email capture is not production delivery.

## Documented journey gaps (not failures of existing tests)

- Inner sub-tabs (e.g. Beauty nails vs makeup) are not all restored on refresh—only shell tab/subpage.  
- Outfit reschedule still delete-and-recreate.  
- Onboarding photographs are not private-media persisted.  
- Live provider quality untested by design.
