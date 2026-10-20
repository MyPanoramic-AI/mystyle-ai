# Beauty Studio test report

Date: 2026-10-20. Offline tests only. No OpenAI, Gemini, FASHN, or retailer request was made.

## Commands

| Command | Result |
| --- | --- |
| `npm run lint` | Exit 0 |
| `npx tsc --noEmit --strict` | Exit 0 |
| `npx tsc --noEmit --strict -p server/api/tsconfig.json` | Exit 0 |
| `npm run build` | Exit 0. Existing Vite `__dirname` and chunk-size warnings |
| `npm run test:api` | 20 passed |
| `npm run test:beauty` | 2 passed |
| `npm run test:account` | 5 passed |
| `npm run test:ai` | 16 passed |
| `npm run test:shopping` | 15 passed |
| `npm run test:tryon` | 16 passed |

`test:api` includes the beauty, family, and wardrobe files. Counting `test:beauty` again would double-count those 2 tests. The unique total for this run is 72.

## Cases covered by `server/api/tests/beauty.test.ts`

The account test checks a missing session, a missing CSRF token, a refused photograph field, preference save, hairstyle, makeup, and nail saves, a duplicate source key, a complete look with four parts, an edit, an owned outfit link, another account's outfit, cross-account read and update, category and text filtering, deletion, a missing import route, session expiry, and the disabled generation boundary. A second test reopens SQLite and checks that the look remains for the owner only.

The existing account-client test still blocks `mystyle_saved_beauty_looks_v1` and `mystyle_beauty_shopping_bag_v1` from import.

## Browser verification

Browser automation was not available. These checks were not clicked through. This remains an outstanding acceptance requirement.

Manual checklist:

1. Register or sign in.
2. Open Beauty Studio and confirm the notice that preview generation is not available.
3. Confirm the demonstration saved looks are not already listed.
4. Save a hairstyle, a makeup look, and a nail style. Confirm "Look saved successfully." only after the request returns.
5. Save the same card again and confirm it reports that the inspiration is already saved.
6. Build a combined look with a name, occasion, hairstyle, colour, makeup, and nails. Save it.
7. Refresh and confirm the saved looks remain.
8. Edit the notes and confirm "Changes saved."
9. Link the look to one of your wardrobe outfits, if you have one.
10. Remove a look after the confirmation prompt.
11. Sign out, sign in as a different account, and confirm the first account's looks are gone.
12. Sign back into the first account and confirm its looks return.
13. Open Family Styling and the Digital Wardrobe and confirm their saved records still load.
14. Stop the API and confirm Beauty Studio reports that the backend is unavailable instead of saying the look was saved.
