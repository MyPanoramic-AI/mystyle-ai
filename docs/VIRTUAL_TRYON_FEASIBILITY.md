# Virtual Try-On Feasibility

Status: **AWAITING LIVE VALIDATION**. The isolated lab and mock tests exist. No paid or unpaid generation has been sent to FASHN, Google, or any other external service. No personal photograph has been uploaded. A local FASHN key is configured for the lab only; that does not count as a live test.

Audit date: 16 October 2026. Lab implementation date: 16 October 2026.

## What the product must prove

Before MyStyle AI spends money at production scale, one specialist provider must demonstrate all of the following on adult images that we are allowed to use:

1. Accept an authorised adult customer's photograph.
2. Accept a garment reference photograph.
3. Send both to the provider from the server, not from the browser.
4. Keep the customer's identity and body appearance recognisable.
5. Represent the garment's colour, pattern, and category convincingly.
6. Return an image the product can show.
7. Report processing time and the actual cost of that call.
8. Fail visibly on policy errors, timeouts, and poor inputs, without substituting a stock photo.

Customer Try On now runs a **local demonstration** job through `/api/tryon/jobs` (see `VIRTUAL_TRYON_CUSTOMER_FLOW.md`). Live FASHN remains disabled by default. The isolated lab under `server/tryon-lab` is unchanged.

## Providers reviewed from public documentation

Marketing pages were not treated as evidence. The notes below come from public docs retrieved on 16 October 2026. Prices and model lifetimes change. They must be re-read on the day a test key is created.

### FASHN AI

Sources reviewed:

- https://docs.fashn.ai/api-reference/tryon-v1-6
- https://docs.fashn.ai/api-reference/tryon-max
- https://help.fashn.ai/plans-and-pricing/api-pricing
- https://docs.fashn.ai/getting-started/api-setup

Documented interface:

- Universal `POST /v1/run` with `model_name` and `inputs`.
- `tryon-v1.6` is documented as stable, released 25 June 2025. It takes a model image and a garment image. Documented credit cost is 1 credit per output image. `num_samples` multiplies that cost.
- `tryon-max` is documented as Preview, released 26 January 2026. It takes a product image and a model image, supports resolution tiers `1k`, `2k`, and `4k`, and generation modes `fast`, `balanced`, and `quality`. The published credit table runs from 1 to 5 credits per output depending on mode and resolution. Omitted mode is documented as billed as `balanced`.
- On-demand price published on the help page: 0.075 US dollars per credit. Minimum purchase: 100 credits (7.50 US dollars). Failed predictions are documented as not consuming credits.
- An API key is issued only after credits are purchased. That means even a single technical test is a paid step.
- The help page also lists monthly commitment tiers. Those are irrelevant until volume exists.

Implications for MyStyle AI:

- v1.6 is the cheaper feasibility candidate if garment coverage (tops, dresses, and similar) is enough for the test.
- Try-On Max is the quality candidate and is still marked Preview, so a feasibility result on Max can change.
- Images would leave our infrastructure and be processed by FASHN. A data-processing review is required before any customer photograph is sent. The feasibility test should use adult images we have rights to, not customer uploads and not children.

Not verified, because no account was opened:

- Actual latency from South Africa.
- Whether v1.6 preserves face and body closely enough for this product.
- Retention and training terms in the current contract.
- South African invoicing and VAT treatment.

### Google Cloud virtual try-on

Sources reviewed:

- https://docs.cloud.google.com/vertex-ai/generative-ai/docs/models/imagen/virtual-try-on-001
- https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/capabilities/generate-virtual-try-on-images
- https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/vto/virtual-try-on-001

Documented interface:

- Model id `virtual-try-on-001`.
- Input is a person image plus one or more product images. Output is 1 to 4 images. MIME types documented as JPEG and PNG.
- One page documents a predict call of the form `POST https://REGION-aiplatform.googleapis.com/v1/projects/PROJECT_ID/locations/REGION/publishers/google/models/virtual-try-on-001:predict` with base64 person and product images.
- The Vertex model page reviewed says launch stage GA, release date 20 January 2026, discontinuation date 20 January 2027, quotas of 50 regional online prediction requests per base model per minute, and maximum image size 10 MB. Page timestamp shown: 2026-05-01 UTC.
- The Gemini Enterprise Agent Platform page for the same model id says release 20 January 2026, deprecation 14 September 2026, and retirement of support on that platform on 15 March 2027. It also lists a 7 MB inline limit and a maximum of 4 output images.
- Content credentials (C2PA) are documented as supported. That is useful for later disclosure that an image was generated.
- Pricing is referred to the Imagen section of the Vertex AI price list. This audit did not copy a per-image dollar amount from that price list, so no Google unit cost is stated here.

Implications:

- Access needs a Google Cloud project and IAM, not a browser API key. That fits the server-side design.
- The two public lifecycle dates do not match. Before choosing Google as the long-term engine, re-check which product surface is actually being purchased and when that model id is scheduled to stop.
- A preview model id `virtual-try-on-preview-08-04` still appears on older non-English documentation. The feasibility test should target the GA id `virtual-try-on-001` unless Google's current page says otherwise on the test day.

Not verified:

- Whether the project would be approved for person generation.
- End-to-end latency and the invoice line for one image.
- Region availability from the operating location we will use.

### Providers not selected

No other vendor is recommended from this pass. A third vendor can be added later through the same `TryOnProvider` interface if the first two fail the identity or garment checks. Choosing a vendor from advertising claims is out of scope.

## Comparison for the feasibility decision

| Question | FASHN tryon-v1.6 | FASHN tryon-max | Google `virtual-try-on-001` |
| --- | --- | --- | --- |
| Public API found | Yes | Yes | Yes |
| Lifecycle in the docs reviewed | Stable | Preview | GA, with conflicting end dates across Google pages |
| Call shape | Person image plus garment image | Product image plus model image | Person image plus product images |
| Published unit cost | 1 credit, listed at $0.075 on-demand | 1–5 credits at the same credit price | Not recorded in this audit; read the current Imagen price table before any call |
| Minimum spend to obtain a key | Documented $7.50 | Same account | Cloud billing account required; minimum was not established |
| Server-side fit | Yes | Yes | Yes |
| Child use | Out of scope for our product regardless of vendor policy | Same | Same |

This table is not a vendor award. The award happens only after the test protocol below has results.

## Test protocol for Phase 2

Do this only after an operator approves a small spend. Still do not use customer photographs or images of children.

1. Prepare a fixed set of adult test images we have rights to use: at least one full-body front photograph and three garment references (a plain top, a patterned dress or skirt, and a jacket). Record the licence for each file in the experiment notes.
2. Re-read the provider pages above on the test day and attach the quotes or screenshots to the experiment record.
3. Implement a temporary server script, not a browser call, that sends one pair, stores the output outside the web root, and writes a row with start time, end time, HTTP status, provider request id, and billed credits or invoice estimate.
4. Run the same pairs through FASHN v1.6 and, if the first results justify the extra credits, one FASHN Try-On Max mode. Run the same pairs through Google only if Cloud billing is already available and the lifecycle date is acceptable.
5. Score each output with a written rubric: face recognisable, body proportions not materially changed, garment colour correct, pattern present, no extra limbs, no substituted outfit. Two reviewers. Disagreement is recorded, not averaged away.
6. Include one deliberate failure: an unsupported file, a timeout, and a missing garment image. The script must record the error and must not invent an image.
7. Publish the numbers in `CURSOR_PROGRESS.md`: latency, success count, failure count, and actual cost. Until a live call is approved and recorded, the phase stays AWAITING LIVE VALIDATION.

## Decision rule

Prefer the provider that passes the rubric on the patterned garment and the jacket, returns a usable image, and has a predictable per-image cost and a contract path for adult customer data. A lower price does not override a failed identity check. A preview model can win a quality comparison and still be rejected for production if its lifecycle is unstable.

## Explicit non-goals for the experiment

- No integration into the React Try On button until the script has a recorded success and a recorded failure.
- No child or family-member photographs.
- No use of the demonstration shop images as if they were licensed garment packs, unless the image rights are checked first. The bundled JPEGs are editorial photographs, not isolated garment cut-outs.

## Implementation added on 16 October 2026

`server/tryon-lab` is a localhost-only Express process. It does not change the consumer screens. Run it with `npm run tryon-lab` after setting `TRYON_LAB_TOKEN` in `server/tryon-lab/.env`. The process binds to `127.0.0.1` or `localhost` only. Provider credentials are read from the environment and are not returned by the API.

### Re-checked provider position

FASHN documentation was fetched again from the same official pages plus:

- https://docs.fashn.ai/api-overview/api-fundamentals
- https://docs.fashn.ai/api-overview/data-retention-privacy
- https://docs.fashn.ai/guides/tryon-javascript-quickstart-guide
- https://docs.fashn.ai/guides/image-preprocessing-best-practices

Confirmed details used by the adapter:

- `POST https://api.fashn.ai/v1/run` and `GET https://api.fashn.ai/v1/status/{id}`.
- v1.6 inputs `model_image` and `garment_image`. Max inputs `model_image` and `product_image`. Both accept a data URI, so the lab does not upload photographs to a public host.
- The adapter always sets `return_base64: true` and requests one image. v1.6 category is `tops`, `bottoms`, or `one-pieces` (`outerwear` is sent as `tops` and stored locally as outerwear). Max has no category field in the official input list, so category is stored only on the lab job.
- Try-On Max documents a 30 MiB file limit, a 15 pixel minimum edge, and aspect ratio 1:16 to 16:1. The v1.6 page does not publish a separate file-size cap. The lab rejects images above 15 MiB so two base64 uploads fit in the local request limit. That is our control, not a claimed FASHN v1.6 maximum.
- JPEG, PNG, and WebP are the formats named in the preprocessing guide. The lab checks magic bytes and dimensions, not the filename.
- On-demand price remains $0.075 per credit. v1.6 is 1 credit. Try-On Max at 1k is 1, 2, or 3 credits for fast, balanced, and quality. Failed predictions are documented as not consuming credits. Minimum purchase remains $7.50.
- Commercial use is stated on the pricing page. Request records are not auto-deleted. Base64 inputs are documented as deleted when processing finishes, with a one-day backstop. Base64 outputs last 60 minutes. There is no deletion endpoint; FASHN says to email legal@fashn.ai.
- Default rate limits: 50 `/v1/run` requests per 60 seconds, 50 status requests per 10 seconds, concurrency 6. The lab does not add its own automatic retry unless `TRYON_MAX_AUTO_RETRIES=1`, and then only for timeout and HTTP 429.

Google was fetched again:

- https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/vto/virtual-try-on-001
- https://docs.cloud.google.com/vertex-ai/generative-ai/docs/models/imagen/virtual-try-on-001

The Agent Platform page still lists `virtual-try-on-001` with deprecation on 14 September 2026 and retirement of that platform's support on 15 March 2027. The older Vertex page says documentation is no longer updated and lists discontinuation on 20 January 2027. Because the current platform page marks the model deprecated, and that date has passed, the lab does not contain a Google client and will not send images there.

Pixelcut's official try-on page, https://www.pixelcut.ai/docs/api-reference/try-on, describes a beta `POST /v1/try-on` on `https://api.developer.pixelcut.ai`. It accepts a binary multipart upload as well as image URLs, limits files to 25 MB and 64 to 6000 pixels, and returns a result URL that is deleted after at most 24 hours. A dollar price was not on that page. Pixelcut is a possible later comparison. It is not integrated, and it was not called. A third-party OpenAPI description of Kling Kolors was found, but the official Kling parameter page was not retrieved in this session, so no Kling endpoint is treated as verified and no Kling adapter was written.

### What the tests actually did

`npm run test:tryon` on 16 October 2026: 15 tests, 15 passed, 0 failed. They used in-memory and temporary files plus a fake `fetch`. They did not spend credits. Covered cases include image bytes, missing person, missing garment, mock success, invalid output, timeout with zero and one automatic retry, rate limit, provider error, invalid credentials, missing key, duplicate submission, live-call approval, budget block, FASHN request shape, and file cleanup.

`npm run lint:tryon`, `npm run lint`, `npx tsc --noEmit --strict`, and `npm run build` also exited 0. A short boot of `npm run tryon-lab` returned HTTP 200 for `/api/health` and `/`, and HTTP 401 for `/api/providers` without the lab token. Live calls were disabled. The process was then stopped.

No quality score has been entered, because no provider image exists to review. Estimated FASHN v1.6 cost per successful output is $0.075. Cost per human-accepted image cannot be calculated yet.

## First live-test preparation, 16 October 2026

This session prepared one `tryon-v1.6` generation and stopped before sending it. Live calls remain disabled. `TRYON_ALLOW_LIVE=false` and `TRYON_MAX_BUDGET_USD=0`. `TRYON_MAX_AUTO_RETRIES=0`.

Official pages checked again:

- https://docs.fashn.ai/api-reference/tryon-v1-6
- https://docs.fashn.ai/api-overview/api-fundamentals
- https://docs.fashn.ai/api-overview/error-handling
- https://docs.fashn.ai/api-overview/data-retention-privacy
- https://help.fashn.ai/plans-and-pricing/api-pricing

The adapter still matches those pages for the first test: `POST https://api.fashn.ai/v1/run` with `Authorization: Bearer`, `model_name: tryon-v1.6`, `model_image` and `garment_image` as data URIs, `num_samples: 1`, `return_base64: true`, then `GET https://api.fashn.ai/v1/status/{id}`. Category values remain `tops`, `bottoms`, and `one-pieces`. The lab stores outerwear locally and sends it as `tops`. Standard quality maps to FASHN `balanced`. v1.6 is 1 credit for every quality mode. The on-demand price on the help page is still $0.075 per credit. Failed predictions are documented as not consuming credits. The lab does not buy credits.

No person photograph and no garment photograph were selected. `server/tryon-lab/private-benchmark/` has no benchmark images. Image validation therefore has no result for this request. The existing checks still require JPEG, PNG, or WebP magic bytes, a minimum edge of 15 pixels, a maximum edge of 8192, an aspect ratio from 1:16 to 16:1, and at most 15 MiB.

Request summary prepared, not sent:

| Item | Value |
| --- | --- |
| Model | `tryon-v1.6` (`fashn-tryon-v1.6`) |
| Garment category | Not selected |
| Photographs | None supplied |
| Estimated cost | $0.075 for one successful output, if on-demand credits are already available |
| Images sent | No |
| Human scores | Unscored |

Photographs will leave this machine only after an explicit approval, and only as base64 data URIs to FASHN. FASHN's current privacy page says base64 inputs are deleted when processing finishes, with a one-day cleanup backstop. Request records are not deleted automatically and there is no deletion API. Base64 outputs remain available for 60 minutes. CDN outputs, which this lab does not request, are scheduled for deletion after three days.

A spend reservation now covers overlapping starts. A new automated test holds the budget at one v1.6 generation and rejects the second concurrent start before a second provider run. Duplicate idempotency keys still return the existing job, and a finished job does not run again.

`npm run test:tryon` after that change: 16 passed, 0 failed. `npm run lint:tryon` exited 0. Earlier in the same session, before that lab-only change, `npm run lint` and `npm run build` exited 0. The build kept the existing Vite chunk-size and native-config warnings. No FASHN request was made.

