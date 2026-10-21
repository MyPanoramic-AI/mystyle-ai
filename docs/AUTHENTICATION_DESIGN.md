# Authentication design

Date: 16 October 2026.

## Account

Registration requires an email address and a password of 12 to 200 characters. The email is trimmed and lower-cased. The password is hashed with scrypt (`N=16384`, `r=8`, `p=1`) and a random salt. The hash is stored. The password is not logged and is not returned.

A new account is `active` with `email_verified_at` unset. Email verification and password recovery use hashed, expiring, single-use tokens and a local capture mailer until a live provider is approved. See `EMAIL_VERIFICATION_IMPLEMENTATION.md` and `PASSWORD_RECOVERY_IMPLEMENTATION.md`.

`status` other than `active` cannot sign in. The API returns `account_disabled`.

## Session

A successful register or login creates a random session token and a separate random CSRF token. The database stores the SHA-256 of the session token, not the token. The response sets `mystyle_session` as HttpOnly, SameSite=Lax, and Path=/. The JSON body contains `userId` and `csrfToken` only. The session token is not in the JSON body and is not written to `localStorage`.

The cookie is not `Secure` on this localhost HTTP server. A later HTTPS deployment must set `Secure` and must not be treated as done by this phase.

Sessions expire after `API_SESSION_HOURS` (default 168). Logout deletes the server session and clears the cookie. An expired or missing session returns 401 on protected routes.

Mutating requests from a signed-in browser must send `x-csrf-token` equal to the CSRF token from login. GET requests do not require it.

## Enumeration and limits

Unknown email and wrong password return the same 401 `invalid_credentials` message. Registering an email that already exists returns 409 `duplicate_email`. That duplicate response does reveal the address. It is recorded here because the registration test needs a distinct result, and it is a weaker protection than the login message.

Register and login are limited per client address and path. The default is 20 attempts in 15 minutes. The test suite uses a limit of 2.

## Authorisation

Every profile, family, wardrobe, look, saved product, and media query includes the session user id. Another account receives 404. The browser cannot supply a different user id.

## Admin

`GET /api/admin/audit` is 503 when `API_ADMIN_TOKEN` is empty. When the token is set, a wrong bearer token is 401. The route returns event type, actor, resource, and time. It does not return passwords, session tokens, or photograph bytes.

## Consumer connection, 16 October 2026

The React app calls this API through the Vite proxy at `/api`. The browser stores the session cookie for the Vite origin. The session token is not written to `localStorage`. The CSRF token stays in JavaScript memory and is refreshed from `GET /api/auth/session`, including after a browser refresh.

`GET /api/auth/session` now also returns the account email. Register and login responses still return only the user id and CSRF token.

An empty `API_ALLOWED_ORIGINS` allows the local Vite origins on ports 3000, 3001, and 4173 for `127.0.0.1` and `localhost` only. Port 3001 is included because Vite uses it when 3000 is already taken. Any other browser origin, including a LAN address, is still rejected. The API host remains `127.0.0.1` or `localhost`.

Email verification and password recovery are implemented with local capture only. Live transactional delivery is not enabled. There is no terms checkbox because this repository does not contain account terms or a privacy-policy document.

## Update, 21 October 2026 — verification and recovery

`GET /api/auth/session` returns `emailVerified`. Registration issues a captured verification message. Password reset always returns a neutral message, revokes sessions on success, and requires a new sign-in. Tokens never appear in ordinary JSON responses. The loopback mailbox is development/test only.

## Not connected

The React membership screen still simulates plans and credits. Those values are not written to `subscription_entitlements` or `credit_ledger`.
