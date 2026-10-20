# Wardrobe test report

Date: 20 October 2026.

No live OpenAI, Gemini, FASHN, or retailer request was made. Browser click-through was not available.

## Commands

| Command | Result |
| --- | --- |
| `npm run lint` | Exit 0 |
| `npm run lint:api` | Exit 0 |
| `npx tsc --noEmit --strict` | Exit 0 |
| `npm run build` | Exit 0. Vite printed the existing `__dirname` warning and the existing chunk-size warning |
| `npm run test:wardrobe` | 2 passed, 0 failed |
| `npm run test:api` | 16 passed, 0 failed. This includes the two wardrobe tests |
| `npm run test:account` | 5 passed, 0 failed |
| `npm run test:ai` | 16 passed, 0 failed |
| `npm run test:shopping` | 15 passed, 0 failed |
| `npm run test:tryon` | 16 passed, 0 failed |

## What the wardrobe tests cover

- Invalid item data returns 400, including a `data:` photograph.
- A JPEG is stored as private media and linked to the item.
- Another account cannot read that photograph, the outfit, or delete the plan.
- Edit item colour, rename an outfit, move a plan date, and delete the item, outfit, and plan.
- After the item is deleted, the outfit no longer lists it.
- After the outfit is deleted, the plan outfit id is empty.
- Saving the same Discover inspiration twice returns the original row.
- An expired session receives 401.
- A file database still contains the item after it is closed and opened again.
- The future wardrobe context for another account is empty and does not include a media field.

The existing account import test still refuses wardrobe and family browser keys.
