# Staging release-candidate checklist

Date: 21 October 2026. This checklist supports a **future controlled staging** deployment. It is **not** commercial launch approval.

## Source and Git

- [x] Freeze commit id: `ca3b3b0aeeb03c9b51e6bda6bbfd6885e8b64516` (Prompt 16; re-verify before any push)
- [ ] Working tree clean after RC tag; secrets untracked
- [x] Auto-deploy risk understood: **do not push** until staging branch/service policy is approved
- [x] Local branch ahead of origin (do not push while Render auto-deploy is on)

## Automated quality

- [x] `npm run lint`
- [x] `npx tsc --noEmit --strict` (app + api)
- [x] `npm run build`
- [x] `npm run test:api` 56 / account 5 / ai 16 / shopping 15 / tryon 16 (unique Node **108**)
- [x] `npm run test:e2e` **27** passed (includes customer-integrations)
- [ ] Re-run the suite on the frozen RC commit before any push

## Security

- [x] HttpOnly session cookie; Secure on hosted profiles
- [x] CSRF on mutating authenticated routes
- [x] Auth rate limits
- [x] Verification/reset token hashes; capture mailbox blocked in staging/production
- [x] Labs not part of `npm start` consumer path
- [ ] Staging secrets only in host env (never Git)
- [ ] Confirm `AI_ALLOW_LIVE=false`, budgets 0, payments off, `EMAIL_CAPTURE_ENABLED` unset/false

## Data / ops

- [ ] Paid plan + persistent disk; `API_DATA_DIR` = mount
- [ ] Pre-migration backup drill on staging fictional data
- [ ] Schema review vs empty and vs upgraded fixtures
- [ ] `/api/health` + `/api/ready` in load balancer config
- [ ] Operator backup/restore documented (`DATABASE_BACKUP_AND_RESTORE.md`)

## Product honesty on staging

- [x] Demo Shop / Try On / Discover labelled
- [x] Membership Preview non-payment
- [x] Mock stylist when live off
- [x] Photo slots private + labelled; external AI consent separate and inactive
- [ ] Staging privacy notice still draft / legal pending

## Explicitly out of scope for this RC

- Live OpenAI / Gemini / FASHN  
- Live retailer feeds  
- Payments  
- Live transactional email  
- Commercial price approval  
- POPIA certification claim  

## Rollback

See `ROLLBACK_AND_RECOVERY.md`. Prefer restore-from-backup over silent schema downgrade.
