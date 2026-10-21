# Remaining product gaps

Date: 21 October 2026. Ordered by impact for a staging RC vs commercial launch.

## Critical / blockers for commercial launch

| Gap | Impact |
| --- | --- |
| Free Render ephemeral storage | Customer SQLite/media unsafe without paid disk |
| Live transactional email | Verification/reset not delivered to real inboxes |
| Live AI quality + POPIA/provider agreements | Stylist cannot be sold as live AI |
| Verified retailer feeds + licensing | Shop cannot claim live stock/price |
| Payments + approved plan economics | Membership cannot sell |
| Legal privacy notice + operator agreements | Export/deletion tech ≠ compliance |
| Editorial image rights | Bundle uses large stock/editorial assets |

## High (staging or pilot)

| Gap | Impact |
| --- | --- |
| Profile photograph private media wiring | Onboarding photos lost on refresh; not in export as owned media |
| AI credits unused by stylist coordinator | Ledger and stylist cost controls are separate |
| Outfit reschedule UX | Delete-and-recreate only |
| Inner-tab restore | Only shell navigation persisted |

## Medium / low

| Gap | Impact |
| --- | --- |
| Further code-splitting (Shop/Stylist/Home) | Main chunk still 639.48 kB |
| Editorial JPEG sizes (605–989 kB) | Bandwidth |
| Gold/cream contrast on unscanned screens | A11y follow-up |
| Membership Select affordances | Already labelled non-payment |

## Closed or improved this phase

| Item | Result |
| --- | --- |
| Refresh loses section (K2 shell) | Fixed via sessionStorage |
| Single ~926 kB JS entry | Split; main 639.48 kB gzip 169.47 kB |
| Axe only on 3 screens | Extended to primary modules (record counts; not WCAG pass) |
