# Database backup and restore

Date: 21 October 2026. Implementation: `server/api/src/ops/backup.ts` and CLI `server/api/src/ops/backupCli.ts`.

## Method

Backups use Node’s `node:sqlite` **`backup()` API** against an open source database, producing a consistent snapshot file. This is preferred over copying a live `mystyle.sqlite` (and WAL) with ordinary filesystem copy while writers are active.

Each backup directory contains:

- `mystyle.sqlite` — snapshot
- `media/` — copy of private media files present at backup time
- `manifest.json` — id, timestamps, SHA-256 checksums, media inventory, migration count, integrity notes

Temporary export ZIP archives under `exports/` are **intentionally omitted**.

## Commands

```bash
npm run backup:create
npm run backup:verify -- <absolute-backup-dir>
npm run backup:restore -- <absolute-backup-dir> <absolute-empty-destination-dir>
```

Automatic backup pruning is **disabled** (`assertBackupPruneDisabled`). Operators delete old archives manually after review.

## Verification and restore

1. `verifyBackup` checks manifest presence, database checksum/size, media checksums, and that the database opens with the expected migration count.
2. `restoreBackup` refuses non-empty destinations, copies database + media, runs `migrate()` (idempotent), and runs `PRAGMA foreign_key_check`.
3. `mediaLedgerConsistency` reports missing files referenced by `media_assets` and orphan files on disk.

## Encryption and access

- Local backups are written **unencrypted** (`encryption: none_local_only` in the manifest).
- Restrict filesystem ACLs on the operator machine.
- Copy archives to **off-service** storage under separate access control before relying on them for disaster recovery.
- Do not commit backups. `server/api/private/*` remains gitignored.

## Media correspondence

A valid restore requires both the SQLite snapshot and the media files listed in the manifest. Orphan media files are copied if present on disk at backup time; missing media keys are reported by the ledger helper and must be investigated before claiming a full recovery.

## Objectives (planning targets — not guarantees)

These are design targets for a future production operation, **not** measured SLAs:

| Objective | Planning target | Notes |
| --- | --- | --- |
| RPO | ≤ 24 hours initially | Align with at least daily operator backup + Render disk snapshot if a disk exists |
| RTO | Hours, not minutes | Single-instance restore, config validation, migration review, smoke tests |

Do not invent stricter guarantees without drills on staging.

## Tests

Isolated fixture coverage lives in `server/api/tests/infrastructure.test.ts` (fictional accounts only; no customer data; no uploads to external services).
