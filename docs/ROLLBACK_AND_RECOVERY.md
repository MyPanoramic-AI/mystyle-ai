# Rollback and recovery

Date: 21 October 2026. Planning document. No production recovery was performed.

## Code rollback

1. Identify the last known-good commit that matches the database schema expectations.
2. Deploy that commit through the approved branch process (after auto-deploy controls are understood).
3. Confirm `/api/health` and `/api/ready`.
4. If the bad deploy already applied a **forward** migration, rolling code back without rolling the schema forward-fix or restoring data can break the app. Prefer **restore from backup** or a tested forward fix.

## Data recovery (SQLite + media)

1. Stop writers if possible (take the service offline) to avoid racing a restore.
2. Verify the chosen backup with `backup:verify`.
3. Restore into an **empty** destination directory (never over the live paths in place).
4. Validate `PRAGMA foreign_key_check`, migration list, and media ledger consistency.
5. Swap `API_DATA_DIR` (or replace files under the disk mount) only after verification.
6. Restart and run smoke tests.

## Render disk snapshot restore

Platform snapshots can restore an entire disk to an earlier point. That **discards** all later disk changes. Do not use snapshot restore as a surgical row-level undelete. Prefer application backups for controlled recovery drills.

## Forward recovery

When a migration is safe and irreversible in place:

1. Keep the new code.
2. Ensure backup was taken pre-migration.
3. Apply a follow-up migration or data repair on a staging copy first.
4. Re-run readiness and account smoke tests.

## What not to do

- Do not delete the only copy of a database to “make room” for a restore.
- Do not enable automatic destructive backup pruning.
- Do not restore production data onto a laptop for debugging without an approved, minimised, fictionalised procedure.
- Do not claim RPO/RTO numbers that have not been drilled.
