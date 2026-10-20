# Family test report

Date: 2026-10-20. Offline tests only. No OpenAI, Gemini, FASHN, or retailer request was made.

## Commands

| Command | Result |
| --- | --- |
| `npm run lint` | Exit 0 |
| `npx tsc --noEmit --strict` | Exit 0 |
| `npx tsc --noEmit --strict -p server/api/tsconfig.json` | Exit 0 |
| `npm run build` | Exit 0. Existing Vite `__dirname` and chunk-size warnings |
| `npm run test:api` | 18 passed |
| `npm run test:family` | 2 passed |
| `npm run test:account` | 5 passed |
| `npm run test:ai` | 16 passed |
| `npm run test:wardrobe` | 2 passed |
| `npm run test:shopping` | 15 passed |
| `npm run test:tryon` | 16 passed |

`test:api` includes `family.test.ts` and `wardrobe.test.ts`. Counting those files again would double-count them. The unique total is 70.

## Cases covered by `server/api/tests/family.test.ts`

The account test creates and edits a profile, rejects a dependent editor, rejects a photograph field, and checks that another account cannot read or delete the profile. It creates an event, checks that omitted allocations add up to the planned total, edits the date and status, and confirms that deleting a participant removes that participant and keeps the event. It rejects a fractional cent amount, a missing member, another account's wardrobe item, a missing CSRF token, a missing session, and an expired session. `POST /api/family/import` returns 404. A second test reopens the SQLite file and checks that the profile is still there, that another owner sees none, and that the future AI boundary excludes the dependent name. `splitBudgetCents(100, 3)` returns `[34, 33, 33]`.

The existing account-client test still asserts that `mystyle_family_members_v1` is never imported.

## Browser verification

Browser automation was not available. These checks were not clicked through.

Manual checklist:

1. Register or sign in.
2. Open Family Styling and confirm the sample names David, Chloe, and Liam are not listed.
3. Add an adult profile and a dependent profile. Confirm "Family profile saved." only after the screen returns.
4. Edit a colour preference and refresh. Confirm it is still there.
5. Remove a profile after the confirmation prompt.
6. Create an event with a date, a colour theme, and a budget. Confirm "Event plan saved."
7. Refresh and reopen the saved plan.
8. Sign out, sign in as a different account, and confirm the first account's family profiles are gone.
9. Sign back into the first account and confirm its profiles return.
10. Turn the API off and confirm the screen reports that the backend is unavailable instead of saying the profile was saved.
