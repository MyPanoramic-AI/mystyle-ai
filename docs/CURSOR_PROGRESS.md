# Cursor Progress

Ongoing record for MyStyle AI. A milestone is complete only when its acceptance criteria are met.

## 2026-10-16 — Phase 1 audit, verification, and planning

**Status of Phase 1:** IN PROGRESS. Audit, build verification, and documentation are done. The baseline commit is not done.

### Changes made

- Initialised a Git repository in the project folder. There was no previous `.git` directory and no history to overwrite.
- Extended `.gitignore` with `.vite/` and `*.tsbuildinfo`. Existing ignores for `node_modules/`, `dist/`, and `.env*` were left in place.
- Corrected a dependency conflict that stopped `npm install`: `esbuild` in `package.json` moved from `^0.25.0` to `^0.28.0`, because Vite 8.3.4 requires `esbuild@^0.27.0 || ^0.28.0` when esbuild is installed directly.
- Clarified `.env.example` so it states that `GEMINI_API_KEY` and `APP_URL` are not read by the current frontend.
- Added the `docs/` planning set listed below.
- `npm install` created `package-lock.json`. That file was not in the export.

No React component, style token, image, or demonstration dataset was removed or redesigned. `npm run clean` was not run.

### Files changed

- `.gitignore`
- `.env.example`
- `package.json`
- `package-lock.json` (generated)
- `docs/PROJECT_OVERVIEW.md`
- `docs/CURRENT_ARCHITECTURE.md`
- `docs/FEATURE_AUDIT.md`
- `docs/BUILD_AND_TEST_REPORT.md`
- `docs/SECURITY_REVIEW.md`
- `docs/PROPOSED_BACKEND_ARCHITECTURE.md`
- `docs/AI_INTEGRATION_PLAN.md`
- `docs/VIRTUAL_TRYON_FEASIBILITY.md`
- `docs/SA_RETAILER_INTEGRATION_PLAN.md`
- `docs/DATA_MODEL_PLAN.md`
- `docs/POC_SCOPE.md`
- `docs/PRODUCTION_DEVELOPMENT_PLAN.md`
- `docs/CURSOR_PROGRESS.md`

### Tests executed

| Command | Result |
| --- | --- |
| `npm install` (first) | Exit 1. `ERESOLVE` between `esbuild@0.25.12` and Vite 8.3.4 |
| `npm install` (after the esbuild range change) | Exit 0. 180 packages added. npm reported 0 vulnerabilities |
| `npm run lint` (`tsc --noEmit`) | Exit 0 |
| `npx tsc --noEmit --strict --pretty false` | Exit 0. This flag is not part of the npm script |
| `npm run build` | Exit 0. Vite 8.3.4, built in 1.33s, with `__dirname` and chunk-size warnings |
| `npm test` | Exit 1. `Missing script: "test"` |
| Preview `GET http://127.0.0.1:4173/` and the built JS and CSS | HTTP 200 for all three. Visual browser clicks were not run |

### Problems encountered

- Git commit failed: `Author identity unknown` and `unable to auto-detect email address`. `git config` was not modified. The export had been staged for that commit. After the commit failed, a mixed `git reset` cleared the index so a later `git commit` cannot record the pre-fix `package.json` while omitting `docs/` and `package-lock.json`. No file was deleted. There is still no commit.
- No browser automation tool was available, so module behaviour was reviewed from source plus an HTTP check of the production bundle.
- npm warned that install scripts for `@google/genai`, `esbuild`, and `protobufjs` were not covered by `allow-scripts`. The Vite build still completed.
- Public documentation for Google `virtual-try-on-001` shows different discontinuation dates on different Google pages. No provider was selected.
- No licensed South African retailer feed was available in the repository. No feed was downloaded.

### Findings that constrain later work

- The UI is a real Vite application. Express, Gemini, payments, try-on generation, and live shopping are not implemented.
- Stylist, shop prices, credits, and beauty previews are simulated.
- Family `localStorage` is seeded with demonstration child profiles. The proof of concept must not send those to a server or a model.
- `resetAllDemoData` does not reset the profile or wardrobe, despite the privacy-screen copy.

### Remaining work for Phase 1

- Set a real Git `user.name` and `user.email` locally, then commit. Suggested split, once identity exists:
  1. Baseline commit of the exported source.
  2. Second commit for `.gitignore`, `.env.example`, the esbuild range, `package-lock.json`, and `docs/`.
- Do not use `git commit` until that identity is intentional. This session did not create either commit.

### Recommended next step

Close the baseline commit, then start Phase 2 from `VIRTUAL_TRYON_FEASIBILITY.md` only after a small spend is approved. Do not connect the Try On button to a provider before that experiment records a success and a failure.

## 2026-10-16 — Phase 2 try-on lab, mock tests, no live calls

**Status of Phase 2:** AWAITING LIVE VALIDATION. The harness, validation, failure tests, and benchmark sheet are in place. No provider was called, so no provider is validated.

### Changes made

- Added `server/tryon-lab`, a localhost-only Express experiment with a mock provider and a gated FASHN adapter.
- Left the consumer React screens, including Try On, unchanged.
- Excluded `server` from the frontend `tsconfig.json` so the lab can use Node types without changing the Vite check.
- Added `npm run test:tryon`, `npm run lint:tryon`, and `npm run tryon-lab`.
- Extended `.gitignore` so private lab images and outputs are not committed.
- Documented empty `TRYON_LAB_TOKEN` and `FASHN_API_KEY` placeholders in `.env.example`.

Git author identity is still unset locally and globally. No commit was created, and Git configuration was not changed.

### Files changed

- `package.json`
- `tsconfig.json`
- `.gitignore`
- `.env.example`
- `server/tryon-lab/**`
- `docs/VIRTUAL_TRYON_FEASIBILITY.md`
- `docs/VIRTUAL_TRYON_BENCHMARK.md`
- `docs/AI_INTEGRATION_PLAN.md`
- `docs/PRODUCTION_DEVELOPMENT_PLAN.md`
- `docs/CURSOR_PROGRESS.md`

### Tests executed

| Command | Result |
| --- | --- |
| `npm run test:tryon` | Exit 0. 15 passed, 0 failed. No provider credits spent |
| `npm run lint:tryon` | Exit 0 |
| `npm run lint` | Exit 0 |
| `npx tsc --noEmit --strict --pretty false` | Exit 0 |
| `npm run build` | Exit 0. Same Vite warnings as the audit |
| `GET http://127.0.0.1:4317/api/health` | HTTP 200, `liveCallsEnabled: false`, budget 0 |
| `GET http://127.0.0.1:4317/` | HTTP 200 |
| `GET http://127.0.0.1:4317/api/providers` without a token | HTTP 401 |

The lab process was stopped after those checks. Browser clicks on the lab form were not run. The HTTP test file did exercise upload, mock generation, duplicate rejection, and image validation through the Express app.

### Problems encountered

- Git still cannot commit until a real `user.name` and `user.email` are set in repository-local config.
- Google `virtual-try-on-001` is past the 14 September 2026 deprecation date on the current Agent Platform page, so it was not integrated.
- The benchmark folder has no authorised photographs, so the 20 slots cannot be scored.

### Remaining work

- Developer provides a Git name and email so the baseline and this lab can be committed separately.
- Approve a FASHN credit purchase before any live call. Minimum documented purchase is $7.50.
- Add authorised adult images under `server/tryon-lab/private-benchmark/`.
- Run one approved v1.6 generation and record duration, credits, and human scores.

### Recommended next step

Set the Git identity and commit. Then approve or decline the $7.50 FASHN credit purchase. Do not connect the consumer Try On button in either case.

## 2026-10-16 — First live FASHN test prepared, not sent

**Status of Phase 2:** AWAITING LIVE VALIDATION. Preparation for one `tryon-v1.6` generation is complete. No FASHN request was sent.

### Changes made

- Confirmed the private lab env holds the FASHN key and that `.env.example` has placeholders only. The private env is gitignored. The repository still has no commits, so the key is not in Git history.
- Kept `TRYON_ALLOW_LIVE=false`, `TRYON_MAX_BUDGET_USD=0`, and `TRYON_MAX_AUTO_RETRIES=0`.
- Re-checked the FASHN v1.6 adapter against the current official run, status, error, privacy, and pricing pages. It still targets `tryon-v1.6` at $0.075 per successful output.
- Serialized live spend reservation so two overlapping starts cannot both pass a one-generation budget.
- Left the consumer frontend unchanged. No photographs were selected or transmitted.

### Files changed

- `server/tryon-lab/src/jobs/service.ts`
- `server/tryon-lab/tests/jobs.test.ts`
- `docs/VIRTUAL_TRYON_FEASIBILITY.md`
- `docs/VIRTUAL_TRYON_BENCHMARK.md`
- `docs/CURSOR_PROGRESS.md`

### Tests executed

| Command | Result |
| --- | --- |
| `npm run test:tryon` | Exit 0. First run 15 passed. After the budget-lock change, 16 passed, 0 failed. Fake `fetch` only |
| `npm run lint:tryon` | Exit 0 after the budget-lock change |
| `npm run lint` | Exit 0. Run before the lab-only budget change; the frontend project excludes `server` |
| `npm run build` | Exit 0, with the existing Vite chunk-size and native-config warnings |
| `GET http://127.0.0.1:4317/api/health` | HTTP 200. `bind` is `127.0.0.1`, `liveCallsEnabled` is false, `budgetUsd` is 0 |
| `GET http://127.0.0.1:4317/` | HTTP 200. The page includes the lab token field and the paid-call approval checkbox |
| `GET http://127.0.0.1:4317/api/providers` with no token and with an incorrect bearer token | HTTP 503, `lab_token_missing`, because `TRYON_LAB_TOKEN` is unset |

The lab was left listening on `127.0.0.1:4317`. No browser click-through was available. The automated HTTP test still covers a configured token, including rejection of a missing bearer token.

### Problems encountered

- No consenting adult photograph or authorised garment photograph was provided, so image validation has nothing to score.
- API submission stays disabled until a local lab token is set. That is separate from the FASHN key.
- Git still has no commits and no author identity.

### Remaining work

- Developer supplies one adult photograph, one garment photograph, and the garment category.
- Developer explicitly approves one paid `tryon-v1.6` generation.
- Only after that approval, set the local budget to $0.075, enable live calls, send one request, record the provider id, duration, and credits, then disable live calls again.
- Human scores stay empty until the developer reviews the output.

### Recommended next step

Do not send the generation yet. Wait for explicit approval, the two photographs, and a garment category. Do not purchase FASHN credits from this session.

## 2026-10-16 — Shopping engine foundation

**Status of Phase 3:** IN PROGRESS. A localhost shopping engine and a retailer feasibility matrix exist. Verified live retailer integrations: 0. Phase 2 try-on validation remains incomplete because the live FASHN generation was postponed.

### Changes made

- Added `server/shopping` with mock connectors, blocked retailer connectors, SQLite storage, search, import, matching, and a local test page.
- Left `src/` and `server/tryon-lab` unchanged.
- Documented the research limits in `docs/SA_RETAILER_FEASIBILITY_MATRIX.md`.
- Did not register for a network, download a retailer feed, or scrape a shop.

### Files changed

- `server/shopping/**`
- `package.json`
- `.gitignore`
- `.env.example` placeholders only
- `docs/SA_RETAILER_INTEGRATION_PLAN.md`
- `docs/SA_RETAILER_FEASIBILITY_MATRIX.md`
- `docs/DATA_MODEL_PLAN.md`
- `docs/PROPOSED_BACKEND_ARCHITECTURE.md`
- `docs/PRODUCTION_DEVELOPMENT_PLAN.md`
- `docs/SHOPPING_ENGINE_IMPLEMENTATION.md`
- `docs/SHOPPING_ENGINE_TEST_REPORT.md`
- `docs/CURSOR_PROGRESS.md`

### Tests executed

| Command | Result |
| --- | --- |
| `npm run test:shopping` | Exit 0. 15 passed, 0 failed |
| `npm run lint:shopping` | Exit 0 |
| `npm run lint` | Exit 0 |
| `npx tsc --noEmit --strict` | Exit 0 |
| `npm run build` | Exit 0, with the existing Vite warnings |
| `npm run test:tryon` | Exit 0. 16 passed, 0 failed |

### Problems encountered

- No authorised product feed or developer API was available for the thirteen researched retailers.
- Git still has no commits and no `user.name` or `user.email`.

### Remaining work

- Project owner approves an affiliate application or a written feed licence before any real catalogue is imported.
- Supply a Git author name and email before the first commit.
- The postponed FASHN generation still needs photographs and a separate spend approval.

### Recommended next step

Ask Cotton On for written permission to use the South Africa product CSV, and check one affiliate directory for Superbalist and Bash. Do not scrape and do not connect the consumer Shop screen until a feed has been verified.

## 2026-10-16 — Local account API

**Status of the backend foundation:** PRESENT, NOT CONNECTED. `server/api` provides accounts, sessions, profiles, private media, family records, wardrobe, saves, and empty entitlement and credit reads. The React app, FASHN lab, and shopping lab were not merged into it. Phase 2 remains AWAITING LIVE VALIDATION. Phase 3 remains a mock shopping engine with zero verified live retailers.

### Git

Repository-local identity is `My Panoramic AI` and `mypanoramic.com@gmail.com`. Global Git identity was not changed. The baseline commit `d583ae7`, message `Record the current MyStyle AI workspace before the production API.`, records the workspace before this API. It is not the original untouched Google AI Studio export.

### Changes made

- Added `server/api` with one SQL migration, scrypt passwords, HttpOnly sessions, CSRF checks, rate limits, and owner-scoped records.
- Ignored `server/api/private/` except `.gitkeep`.
- Added `lint:api`, `test:api`, and `api` scripts.
- Added empty API placeholders to `.env.example`.
- Wrote the backend, authentication, schema, test, and integration documents.

### Tests executed

Recorded in `docs/BACKEND_TEST_REPORT.md`. `test:api` 14 passed. `test:tryon` 16 passed. `test:shopping` 15 passed. Frontend lint, strict TypeScript, and the Vite build exited 0.

### Remaining work

- Do not connect the consumer screens until a later prompt.
- Email verification, password recovery, and payment are unavailable.
- The live FASHN generation is still waiting for photographs and a separate spend approval.
- Retailer feeds still need written permission.


