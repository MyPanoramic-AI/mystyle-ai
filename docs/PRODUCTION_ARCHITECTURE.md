# Production architecture

Date: 21 October 2026. Prepared for a future secure deployment. **Nothing in this document was deployed.** The live site at `https://mystyle-ai.onrender.com` still serves older code than local `master`.

## Current repository topology (verified)

| Piece | Location | Role |
| --- | --- | --- |
| React / Vite UI | `src/`, build to `dist/` | Consumer frontend |
| Express API | `server/api` | Auth, profiles, wardrobe, family, beauty, AI coordinator, membership, privacy |
| SQLite | `server/api/private/mystyle.sqlite` (default) | Application data |
| Private media | `server/api/private/media/` | Owner-checked photographs |
| Export archives | `server/api/private/exports/` | Temporary ZIP jobs |
| FASHN Try-On Lab | `server/tryon-lab` | Separate local lab; not part of the consumer web service start path |
| Shopping Lab | `server/shopping` | Separate local lab |
| Render Blueprint | `render.yaml` | Free web service, Node 24.4.0, `npm install && npm run build`, `npm start` |

`npm start` runs `tsx server/api/src/index.ts`, which loads configuration, migrates SQLite, and serves the API. On Render / staging / production profiles it also serves `dist/` as same-origin static files.

## Migration inventory (001–009)

| Order | File | Depends on | Domain |
| --- | --- | --- | --- |
| 1 | `001_initial.sql` | — | Users, sessions, profiles, media, family shell, ledger/audit stubs |
| 2 | `002_profile_details.sql` | 001 | Extended profile fields |
| 3 | `003_ai_conversations.sql` | 001 | Stylist conversations and messages |
| 4 | `004_ai_usage_duration.sql` | 003 | Usage duration columns |
| 5 | `005_wardrobe_planner.sql` | 001 | Wardrobe, looks, products, outfit plans |
| 6 | `006_family_plans.sql` | 001 | Family events and participants |
| 7 | `007_beauty_studio.sql` | 001, 005 (optional links) | Beauty preferences, looks, outfit links |
| 8 | `008_membership_accounting.sql` | 001 | Plans, entitlements, credits, reservations |
| 9 | `009_privacy_controls.sql` | 001 | Consent, export jobs, deletion, retention policies |

Migrations run in filename order inside a transaction per file, recorded in `schema_migrations`. Re-running is idempotent (already-applied versions skip). Partial failure rolls back that file’s transaction. **Do not migrate a live production database without a verified backup and a schema comparison against a copy.**

## Recommended initial deployment topology

Keep one web service (same-origin SPA + API). Avoid PostgreSQL, Kubernetes, and microservices until scale or multi-instance needs appear.

```
Internet
   │
   ▼
Render TLS termination (HTTPS)
   │
   ▼
Single Node web service (bind 0.0.0.0:$PORT)
   ├── Express API (/api/*)
   ├── Static React assets (dist/)
   └── Persistent disk mount (REQUIRED for durability)
         ├── mystyle.sqlite (+ WAL/SHM companions)
         ├── media/
         ├── exports/   (short-lived; omit from long-term backups)
         └── backups/   (optional local staging before off-service copy)
```

Labs stay off the public consumer service until separately approved.

## Same-origin and cookies

- Serve UI and API from one HTTPS origin so `HttpOnly; SameSite=Lax; Secure` session cookies work without cross-site credential gymnastics.
- Enable `trust proxy` on hosted profiles so Express sees HTTPS correctly behind Render.
- Restrict `API_ALLOWED_ORIGINS` to the public HTTPS origin; localhost origins are refused in staging/production.

## SQLite operational limits (initial)

Acceptable for a low-traffic single-instance launch **only with a persistent disk**:

- One writer process; no horizontal scale-out of the API instance that owns the database file.
- Brief downtime on deploy when a disk is attached (Render stops the old instance before starting the new one).
- Operator-run backups via the SQLite backup API; off-service copy required.
- Disk growth from media must be monitored.

### Conditions that justify leaving SQLite later

- Need for multiple API instances or zero-downtime rolling deploys with shared state.
- Sustained write contention or database files that outgrow a single disk comfort zone.
- Requirement for managed point-in-time recovery beyond disk snapshots and operator backups.
- Cross-region durability requirements that a single mounted SSD cannot meet.

Moving to managed Postgres (or another store) plus object storage for media would be a separate, approved project.

## Health and process model

| Endpoint | Meaning |
| --- | --- |
| `GET /api/health` | Liveness — process is up |
| `GET /api/ready` | Readiness — SQLite answers `SELECT 1` |

A 200 from liveness alone is not full readiness. Jobs (export expiry, retention dry-run) run in-process when invoked; there is no separate worker fleet in this revision.

## Explicitly out of scope until approved

- Changing the live Render service or purchasing a disk
- Pushing to GitHub (auto-deploy)
- Enabling live OpenAI, Gemini, FASHN, payments, or retailer connectors
- Automatic destructive retention cleanup
