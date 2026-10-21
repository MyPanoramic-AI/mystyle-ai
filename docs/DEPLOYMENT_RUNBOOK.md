# Deployment runbook

Date: 21 October 2026. **Do not execute a production deploy from this document without explicit approval.** Local `master` is ahead of GitHub; Render auto-deploys on push.

## Preconditions

1. Frozen release-candidate commit id recorded.
2. Staging service exists **or** an approved plan to create one (separate from production).
3. Paid plan + persistent disk attached for any environment that stores SQLite/media (see `RENDER_DEPLOYMENT_ASSESSMENT.md`).
4. Secrets present only in the host environment / Dashboard — not in Git.
5. `APP_ENV=staging` or `production` with passing config validation.
6. Live AI, payments, retailer connectors, and destructive retention remain off unless separately approved.

## Release process (proposed)

1. **Freeze RC** — tag or name the local commit; no further feature commits on that line.
2. **Branch** — push only an approved `release/*` or `staging` branch after auto-deploy risk is understood (pause production auto-deploy if needed — manual Dashboard action).
3. **Staging deploy** — isolated service + disk + secrets.
4. **Automated gates** — `npm run lint`, strict `tsc`, `npm run build`, `test:api`, `test:account`, `test:ai`, `test:shopping`, `test:tryon`, `test:infra`, `test:e2e` as applicable.
5. **Config validation** — boot staging; confirm process exits on missing secrets; confirm Secure cookies over HTTPS.
6. **Backup gate** — for any environment with real data, take a verified SQLite+media backup before migrations.
7. **Migration review** — compare `schema_migrations` on a **copy** of the target database; never assume an old Render schema matches local 001–009.
8. **Deployment approval** — human sign-off.
9. **Post-deploy checks** — `GET /api/health` (live), `GET /api/ready` (db), sign-in smoke, static asset load, no secret leakage in logs.
10. **Rollback plan** — see `ROLLBACK_AND_RECOVERY.md`.

## What this phase did not do

- No Git push
- No Render Dashboard changes
- No production migration
- No production backup of live customer data (none should be treated as trustworthy on Free ephemeral storage)

## Operator checklist (staging first)

- [ ] Disk mounted; `API_DATA_DIR` set
- [ ] `RENDER_EXTERNAL_URL` / `API_PUBLIC_ORIGIN` is `https://…`
- [ ] `API_ALLOWED_ORIGINS` has no localhost entries
- [ ] `API_ADMIN_TOKEN` set (≥20 characters)
- [ ] `AI_ALLOW_LIVE=false`, budgets 0
- [ ] `PAYMENTS_ENABLED` unset/false
- [ ] `API_RETENTION_CLEANUP_ENABLED=false`
- [ ] Health and ready endpoints OK
- [ ] Backup create + verify on staging fictional data
