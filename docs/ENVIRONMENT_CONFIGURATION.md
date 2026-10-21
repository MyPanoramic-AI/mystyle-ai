# Environment configuration

Date: 21 October 2026.

Profiles are resolved by `APP_ENV` / `MYSTYLE_ENV`, else `RENDER=true` → `production`, else `NODE_ENV=test` → `test`, else `development`. Implementation: `server/api/src/ops/environment.ts` and `server/api/src/config.ts`.

## Profiles

| Profile | HTTPS public origin | Secure cookies | Admin token | Localhost-only origins | Serve `dist/` | Live AI default | Retention cleanup default |
| --- | --- | --- | --- | --- | --- | --- | --- |
| development | optional | off unless `API_SECURE_COOKIE=true` | optional | allowed | off unless `API_SERVE_STATIC=true` | refused if enabled without local intent | off |
| test | optional | off | optional | allowed | off | refused | off |
| staging | **required** `https://` | **required** | **required** (≥20 chars) | **refused** | on | **refused** | off; ACK required if forced in production rules |
| production | **required** `https://` | **required** | **required** | **refused** | on | **refused** | off; needs `API_RETENTION_CLEANUP_ACK` |

Production/staging also refuse `PAYMENTS_ENABLED=true` in this revision.

## Important variables

| Variable | Purpose |
| --- | --- |
| `APP_ENV` | Profile selection |
| `API_HOST` / `PORT` | Bind address / Render port |
| `API_PUBLIC_ORIGIN` / `RENDER_EXTERNAL_URL` | Canonical HTTPS origin |
| `API_ALLOWED_ORIGINS` | CORS / mutating Origin allow-list |
| `API_DATA_DIR` | Absolute data root (disk mount in production) |
| `API_SECURE_COOKIE` | Force Secure cookies on local HTTPS testing |
| `API_TRUST_PROXY` | Express `trust proxy` (auto on hosted profiles) |
| `API_ADMIN_TOKEN` | Bearer for operator routes |
| `API_RETENTION_CLEANUP_ENABLED` / `API_RETENTION_CLEANUP_ACK` | Destructive cleanup gate |
| `AI_ALLOW_LIVE` | Live provider gate (blocked on staging/production) |
| `PAYMENTS_ENABLED` | Must stay false |

Never commit real values. Use `server/api/.env` (gitignored). `.env.example` holds placeholders only.

## Validation behaviour

`loadConfig()` throws before listen if staging/production rules fail. Startup logs `config_failed` without printing secret values. Local development continues to allow `127.0.0.1` binds and non-Secure cookies on HTTP.

## Local vs hosted data directories

- Local default: `server/api/private/`
- QA isolation: set absolute `API_DATA_DIR` to a temporary directory
- Render disk: set `API_DATA_DIR` to the disk mount path (for example `/var/data`)
