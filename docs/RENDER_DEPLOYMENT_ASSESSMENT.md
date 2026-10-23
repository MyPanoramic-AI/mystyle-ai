# Render deployment assessment

Updated: 22 October 2026. Based on the repository `render.yaml`, local Git state, and [Render documentation](https://render.com/docs/disks) / [free plan limits](https://render.com/docs/free). **No live Render settings were changed from this workspace. No disk was purchased via Dashboard/MCP. No deploy was triggered.**

## What is configured in the repo today

| Item | Evidence |
| --- | --- |
| Service name | `mystyle-ai` in `render.yaml` |
| Plan (Blueprint) | `starter` (required for a disk; Free cannot attach disks) |
| Runtime | Node, `NODE_VERSION=24.4.0` |
| Build / start | `npm install && npm run build` / `npm start` |
| Persistent disk (Blueprint) | `mystyle-data` at `/var/data`, `sizeGB: 1`, with `API_DATA_DIR=/var/data` |
| Auto-deploy | Documented as GitHub-connected; Blueprint changes apply only after sync/deploy |

The public URL `https://mystyle-ai.onrender.com` still reflects whatever commit GitHub last deployed. Until this Blueprint is synced and the service leaves Free, hosted logins remain on an ephemeral filesystem.

## Filesystem persistence (blocker)

Render’s default filesystem is **ephemeral**. Files written outside a persistent disk mount are lost on:

- Redeploy
- Restart
- Free-plan spin-down after ~15 minutes idle

[Free web services cannot attach persistent disks](https://render.com/docs/free). Uploaded photographs and a SQLite file on the ordinary container filesystem **will not survive** those events.

### Paid persistent disk (documented behaviour)

From [Persistent Disks](https://render.com/docs/disks):

- Available on paid web / private / worker services (not Free).
- Only paths under the configured **mount path** survive deploys and restarts.
- Disk is usable by **one instance** only — no horizontal scaling with a disk attached.
- Disk is **not** available during build or pre-deploy commands.
- Attaching a disk **disables zero-downtime deploys**; Render stops the old instance before starting the new one (brief downtime).
- Encrypted at rest; automatic daily snapshots retained at least seven days (platform feature — not a substitute for application-level backup testing).

### Recommendation (Blueprint prepared in repo)

1. **Production blocker on Free plan:** do not store customer SQLite or private media on a Free service filesystem.
2. The repo `render.yaml` now declares **starter + 1 GB disk** at `/var/data` with `API_DATA_DIR=/var/data`. Syncing it upgrades off Free and starts paid usage.
3. Keep a **single instance**.
4. Run operator SQLite backups (see `DATABASE_BACKUP_AND_RESTORE.md`) and copy archives **off the service**.
5. Treat Render disk snapshots as a secondary recovery aid, not the only backup.
6. `/api/ready` reports `persistence: persistent | ephemeral | local`. Ephemeral hosts show an in-app warning banner.

Estimated platform needs (order-of-magnitude, verify current Render pricing before purchase):

- Paid web instance capable of attaching a disk
- Disk sized for SQLite + media growth + local backup staging
- Optional separate staging service with its own disk (never share production disk)

Exact ZAR/USD figures were not locked in this pass; obtain current Dashboard pricing before approval.

## Rollback limitations on Render

- Git revert + redeploy restores **code**, not ephemeral filesystem data.
- With a disk, rolling back code while keeping the disk can leave **schema/code mismatch** if migrations already ran forward — see `ROLLBACK_AND_RECOVERY.md`.
- Snapshot restore replaces the **entire** disk state and discards later disk changes.

## Staging isolation

Do not point a staging service at the production disk or production database file. Use a separate service + separate disk + separate secrets. Auto-deploy from `master` should be paused or redirected before pushing release candidates (manual approval required; not changed in this phase).

## Verdict

| Question | Answer |
| --- | --- |
| Can a Free Render service safely host SQLite + private photos? | **No — production blocker** |
| Is a single paid web service + disk a viable first topology? | **Yes, with single-instance and downtime caveats** |
| Is that topology declared in `render.yaml`? | **Yes (starter + `/var/data` disk)** |
| Was a live disk purchased or deploy triggered from this pass? | **No** |
