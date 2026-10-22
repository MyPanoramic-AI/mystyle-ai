# Remaining product gaps

Date: 22 October 2026. Ordered by impact for a staging RC vs commercial launch.

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
| AI credits unused by stylist coordinator | Ledger and stylist cost controls are separate |
| Inner-tab restore | Only shell navigation persisted |

## Medium / low

| Gap | Impact |
| --- | --- |
| In-session password / email change | Only public reset + register email; no signed-in change endpoints |
| Login session hygiene | New login does not revoke other sessions |
| Further code-splitting (Shop/Stylist/Home) | Main chunk still ~644 kB |
| Editorial JPEG sizes (605–989 kB) | Bandwidth |
| Gold/cream contrast on unscanned screens | A11y follow-up |

## Closed in Prompt 16

| Item | Result |
| --- | --- |
| Profile photograph private media wiring | Three slots + `private_photo_storage` consent |
| Shop wishlist account wiring | Authenticated `/api/saved-products` |
| Dual membership UI for signed-in accounts | Server entitlement + test credits; preview read-only |
| Outfit reschedule UX | Date edit on existing plans |

## Closed or improved in Prompt 15

| Item | Result |
| --- | --- |
| Refresh loses section (K2 shell) | Fixed via sessionStorage |
| Single ~926 kB JS entry | Split; main ~639–644 kB |
| Axe only on 3 screens | Extended to primary modules (record counts; not WCAG pass) |
