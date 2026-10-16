# Backend test report

Date: 16 October 2026. Commands were run in the project folder after the account API was added. No browser click-through was performed. No paid provider was called.

| Command | Result |
| --- | --- |
| `npm run lint` | Exit 0 |
| `npx tsc --noEmit --strict` | Exit 0 |
| `npm run lint:api` | Exit 0 |
| `npm run lint:tryon` | Exit 0 |
| `npm run lint:shopping` | Exit 0 |
| `npm run test:api` | Exit 0. 14 passed, 0 failed |
| `npm run test:tryon` | Exit 0. 16 passed, 0 failed |
| `npm run test:shopping` | Exit 0. 15 passed, 0 failed |
| `npm run build` | Exit 0. Vite 8.3.4 warned about `__dirname` in `vite.config.ts` and a JavaScript chunk larger than 500 kB |

## API tests that passed

- Migrations create the account tables and a second run applies nothing.
- `API_HOST=0.0.0.0` is rejected.
- A thrown database error on health returns 503 and the body does not contain the path from the error.
- Health reports `127.0.0.1` and `database: up`.
- Register, session check, logout, login, expiry, and a profile request without a cookie.
- Unknown email and wrong password return the same 401 message.
- Duplicate registration returns 409. A short password and a malformed email return 400.
- A disabled account cannot sign in.
- The third registration inside a limit of two returns 429.
- An `Origin` of `https://evil.example` is rejected.
- The audit route is 503 without a token and 401 with the wrong bearer token.
- A second account cannot read the first account's wardrobe item, family record, or saved product, and cannot attach the first account's wardrobe item to a look.
- A dependent family record cannot be given editor permission.
- A non-image upload is rejected. A purpose of `child_photo` is rejected. The owner can read a JPEG. Another account receives 404. Delete and retention cleanup both make the file unreadable.
- A new account has no entitlements and a zero credit balance. Try-on and billing report `not_connected`.

## Not verified

The consumer screens were not opened in a browser. The API was exercised through its test server on `127.0.0.1` and an ephemeral port.
