# Virtual Try-On Benchmark

Status: **AWAITING LIVE VALIDATION**. The score sheet and the 20-case manifest exist. No provider has been called, so there are no likeness, colour, cost, or failure-rate measurements to report.

## How to add images

Place authorised adult photographs and garment images in `server/tryon-lab/private-benchmark/`. The directory is gitignored except for `.gitkeep`. Use the filenames in `server/tryon-lab/data/benchmark-manifest.json`. Do not commit the photographs.

The 20 slots cover tops, bottoms, one-pieces, and outerwear, and they vary colour, body proportion, pose, background, lighting, and garment complexity. Every slot currently has `personPresent: false` and `garmentPresent: false` until those local files exist. No photographs were downloaded for this manifest.

## What is recorded for each run

Each lab job stores:

- Test id, when the draft was linked to a benchmark slot.
- Provider id and model name.
- Garment category.
- Input file ids, not the image bytes, in the job record.
- Provider job id, when a provider returns one.
- Status: draft, running, succeeded, or failed.
- Processing duration in milliseconds.
- Estimated USD cost before the call, and actual credits and USD cost when the provider reports `x-fashn-credits-used`.
- Human scores from 1 to 5 for personal likeness, body proportions, garment accuracy, colour accuracy, garment details, image realism, and background preservation.
- Defect notes and an accepted or rejected outcome.

Provider success does not fill the scores and does not set `accepted`. `summarise()` in `server/tryon-lab/src/benchmark/summary.ts` returns `providerValidated: false` and `phaseStatus: "AWAITING_LIVE_VALIDATION"`.

## First live case

Not started. No adult photograph and no garment photograph have been selected, so there is no validation result, provider job id, duration, credit count, or side-by-side comparison. Human-review fields stay empty. The intended first model is `tryon-v1.6`, one output, estimated at $0.075 on the current on-demand price. Try-On Max is not part of this test.

## Results

| Provider | Live calls | Successes | Failures | Mean duration | Actual cost | Human-accepted | Outcome |
| --- | --- | --- | --- | --- | --- | --- | --- |
| FASHN tryon-v1.6 | 0 | — | — | — | — | — | Not tested |
| FASHN tryon-max | 0 | — | — | — | — | — | Not tested |
| Google virtual-try-on-001 | 0 | — | — | — | — | — | Not called. Deprecated for new work |
| Local mock | Automated tests only | Not a quality result | Not a quality result | Not a provider measurement | $0 | Not reviewed | Operational test double |

Mock jobs are excluded from the live counts. They prove the lab can record a failure and a success without a network call.

## Recommendation

Do not select a production provider yet. The first live comparison, after approval to spend at least the $7.50 FASHN credit minimum, should start with `tryon-v1.6` because it is documented as stable and costs 1 credit ($0.075) per successful output. Try-On Max stays available in the same adapter for a later quality comparison at 2 credits ($0.15) for the default balanced 1k setting. Google is not in that comparison unless a current, non-deprecated contract and price are confirmed.
