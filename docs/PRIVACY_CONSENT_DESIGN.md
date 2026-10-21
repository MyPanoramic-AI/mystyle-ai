# Privacy consent design

Date: 21 October 2026.

## Purposes

Each purpose is recorded separately in `consent_records`. Defaults at registration are withdrawn.

| Purpose | Meaning | Effect in this revision |
| --- | --- | --- |
| `ai_personalisation` | Use saved style lists in the stylist context | Updates `user_preferences.ai_personalisation_consent`. Live providers stay off. |
| `marketing` | Optional marketing communications | Updates `marketing_opt_in`. No mailer is connected. |
| `external_photo_ai` | Optional processing of adult photographs by an external AI service | Recorded only. FASHN and other image providers are not called. |
| `browser_profile_import` | Optional import of a previous browser style profile | Does not import demonstration family or child profiles. |

## Record fields

- Account owner (`user_id`)
- Purpose
- Status `granted` or `withdrawn`
- Timestamp
- Privacy notice version (`draft-0` until a notice is published)
- Capture method (`registration_default`, `settings_toggle`, `import_review`, `api`)
- Minimal evidence JSON (purpose, status, notice version, optional source)

## Rules

- Consent is not bundled. Saving a style profile does not grant photograph processing.
- Account-holder consent does not grant processing for a dependent family profile.
- Withdrawal is recorded and clears the matching preference flag for AI personalisation and marketing.
- External photograph AI consent never starts a provider call in this phase.

## Privacy notice placeholder

`GET /api/privacy/notice` returns a draft placeholder with purpose, category, rights, retention, and cross-border stubs. Status is `draft`. It is not a legally approved notice. Customers are not forced to accept fictional terms.
