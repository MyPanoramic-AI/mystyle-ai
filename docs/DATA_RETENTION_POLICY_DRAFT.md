# Data retention policy draft

Date: 21 October 2026. This is a technical draft for legal review. It does not invent statutory retention periods.

| Category | Status | Action | Notes |
| --- | --- | --- | --- |
| Inactive accounts | undecided | review | No automatic purge. |
| Expired sessions | configured | delete | Safe to remove expired session rows. |
| Temporary uploads | configured | delete | Aligns with `API_MEDIA_RETENTION_DAYS` (default 30). |
| Deleted account personal data | configured | delete | Removed when deletion completes. |
| AI conversations | configured | delete | Removed with the account or by customer delete. |
| AI usage metadata | undecided | retain_pseudonymous | Cost accounting. |
| Test data | configured | delete | Temporary test stores only. |
| Audit events | undecided | retain_pseudonymous | Security and privacy-request evidence. |
| Credit and financial records | undecided | retain_pseudonymous | Ledger integrity. |
| Privacy request evidence | undecided | retain | Export and deletion request metadata. |
| Consent history | undecided | retain_pseudonymous | Grant and withdrawal evidence. |

## Scheduling

`GET /api/privacy/retention/preview` and `POST /api/admin/retention/dry-run` report intended actions without deleting.

`POST /api/admin/retention/cleanup` stays disabled unless `API_RETENTION_CLEANUP_ENABLED=true` and the body includes `confirmDestructive: true`. No production scheduler is activated in this revision.
