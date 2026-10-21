# Observability plan

Date: 21 October 2026. Structured logging is implemented locally via `logEvent` in `server/api/src/errors.ts`. **No external APM, log drain, or alerting product was purchased or connected.**

## Structured events (implemented)

Startup and failure paths emit JSON lines with `level`, `event`, and `at`. Sensitive key names matching password/token/secret/api key/session/measurement/photograph/conversation patterns are redacted to `[redacted]`.

Useful events:

| Event | When |
| --- | --- |
| `config_failed` | Mandatory staging/production config missing |
| `api_starting` / `api_listening` | Process boot |
| `database_ready` / `database_failed` | SQLite open/migrate |
| `backup_created` / `backup_verified` / `backup_restored` | Operator backup CLI |
| `backup_prune_refused` | Attempt to use automatic prune |

Application routes should continue to return `publicError` bodies without stack traces or filesystem paths (covered by health/ready failure tests).

## Do not log

- Passwords, session tokens, CSRF secrets, API keys
- Private photograph bytes or paths that reveal customer content
- Raw AI conversation text
- Family profile details or body measurements

## Recommended monitors (not connected)

| Signal | Suggested alert |
| --- | --- |
| `/api/ready` non-200 for N minutes | Page on-call |
| Process crash / exit loop | Page on-call |
| Elevated `401`/`429` on `/api/auth/*` | Investigate abuse |
| Migration failure on boot | Block traffic; restore/fix |
| Disk usage on data mount | Capacity warning |
| Backup job missing for >RPO target | Operator reminder |
| Unexpected `AI_ALLOW_LIVE` or payment flags | Security review |

Ship logs to a retained store only after legal and POPIA review of log contents.

## Health vs readiness

- Liveness (`/api/health`) — restart policy / load balancer “process up”
- Readiness (`/api/ready`) — receive traffic only when SQLite responds

Do not expose user counts, schema dumps, or absolute data paths on public endpoints.
