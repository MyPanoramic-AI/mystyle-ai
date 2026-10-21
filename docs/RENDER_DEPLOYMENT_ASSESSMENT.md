# Render deployment assessment

Date: 21 October 2026. Based on the repository `render.yaml`, local Git state, and [Render documentation](https://render.com/docs/disks) / [free plan limits](https://render.com/docs/free). **No Render settings were changed. No disk was purchased. No deploy was triggered.**

## What is configured today

| Item | Evidence |
| --- | --- |
| Service name | `mystyle-ai` in `render.yaml` |
| Plan | `free` |
| Runtime | Node, `NODE_VERSION=24.4.0` |
| Build / start | `npm install && npm run build` / `npm start` |
| Persistent disk | **Not declared** in `render.yaml` |
| Auto-deploy | Documented as GitHub-connected; local `master` was ahead of origin at assessment time |

The public URL `https://mystyle-ai.onrender.com` therefore reflects whatever commit GitHub last deployed — **not** the newer local branch that includes the Express API, SQLite domains, and privacy controls.

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

### Recommendation (not implemented)

1. **Production blocker on Free plan:** do not store customer SQLite or private media on the current Free service filesystem.
2. Before any production cutover of this architecture: move the web service to a **paid plan**, attach a disk (start small, e.g. 1–10 GB), mount at an absolute path such as `/var/data`, and set `API_DATA_DIR=/var/data`.
3. Keep a **single instance**.
4. Run operator SQLite backups (see `DATABASE_BACKUP_AND_RESTORE.md`) and copy archives **off the service**.
5. Treat Render disk snapshots as a secondary recovery aid, not the only backup.

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
| Can the current Free Render service safely host SQLite + private photos? | **No — production blocker** |
| Is a single paid web service + disk a viable first topology? | **Yes, with single-instance and downtime caveats** |
| Was anything purchased or reconfigured? | **No** |
