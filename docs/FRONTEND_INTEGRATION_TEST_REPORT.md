# Frontend integration test report

Date: 16 October 2026. No browser automation tool was available, so the screens were not click-tested. The proxy, cookie, and profile save were checked over HTTP.

## Automated results

| Command | Result |
| --- | --- |
| `npm run lint` | Exit 0 |
| `npx tsc --noEmit --strict` | Exit 0 |
| `npm run lint:api` | Exit 0 |
| `npm run lint:tryon` | Exit 0 |
| `npm run lint:shopping` | Exit 0 |
| `npm run test:account` | Exit 0. 5 passed, 0 failed |
| `npm run test:api` | Exit 0. 14 passed, 0 failed |
| `npm run test:tryon` | Exit 0. 16 passed, 0 failed |
| `npm run test:shopping` | Exit 0. 15 passed, 0 failed |
| `npm run build` | Exit 0. Existing Vite `__dirname` and large-chunk warnings |

`test:account` covers registration validation, login request shape, a CSRF retry, network and credential failures, refusal to import family or unselected measurements, and replacement of the previous account profile.

## Proxy check

Vite was already using port 3000, so this session's dev server started at `http://127.0.0.1:3001/` and proxied `/api` to `127.0.0.1:4331`.

| Check | Result |
| --- | --- |
| Register through the proxy | 201 |
| `Set-Cookie` is HttpOnly and SameSite=Lax | Yes |
| Session token present in the JSON body | No |
| Session request with that cookie | 200, and the email matched |
| Profile save with the CSRF token | 200, name and completed onboarding stored |
| Profile save without the CSRF token | 403 |
| Login with a LAN `Origin` | 403 |
| Logout, then the same cookie | 200, then 401 |

## Manual checks not run

Open `http://127.0.0.1:3000` or `http://localhost:3000` with `npm run api` and `npm run dev` both running. Register, refresh, confirm the session returns, finish onboarding, edit the profile, sign out, and sign in as a second adult. Confirm the first adult's name and measurements are gone. With the API stopped, confirm the unavailable message and that the demonstration banner appears only after choosing it.
