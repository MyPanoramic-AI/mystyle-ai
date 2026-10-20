# AI Usage and Cost Controls

Date: 20 October 2026.

Live model calls are off. No provider invoice was created while building this phase, and no live spend is recorded.

## Switches

| Variable | Default | Effect |
| --- | --- | --- |
| `AI_ALLOW_LIVE` | false | Must be exactly `true` before a Gemini call |
| `AI_PROVIDER` | `mock` | `gemini` selects the live adapter |
| `AI_MODEL` | empty | Required for a live call. Not hard-coded |
| `GEMINI_API_KEY` | empty in the example | Server only. A missing key returns 503 and does not call the network |
| `AI_MAX_BUDGET_USD` | 0 | Development total. A live estimate above the remainder returns 429 |
| `AI_MAX_USER_BUDGET_USD` | 0 | Same check for one account |
| `AI_INPUT_USD_PER_MILLION` | empty | Required. Taken from a pricing page the operator has checked |
| `AI_OUTPUT_USD_PER_MILLION` | empty | Required. An empty price blocks the live call |
| `AI_MAX_OUTPUT_TOKENS` | 800 | Sent as `maxOutputTokens` and used in the pre-call estimate |
| `AI_MAX_INPUT_TOKENS` | 4000 | Upper bound used only for the pre-call estimate |
| `AI_THINKING_BUDGET` | 0 | Sent as `thinkingConfig.thinkingBudget` for Gemini 2.5 Flash |
| `AI_MAX_LIVE_REQUESTS` | 0 | Successful and failed Gemini attempts share this cap. Zero blocks live calls |
| `AI_TIMEOUT_MS` | 20000 | Aborts the provider request. There is no retry |
| `AI_MESSAGE_RATE_LIMIT` | 30 | Messages per account per window |
| `AI_MAX_INPUT_CHARS` | 2000 | Rejects longer messages with 400 |

`.env.example` contains these names and empty prices. It does not contain a working key.

## How cost is recorded

Mock replies store `cost_usd` 0 and `cost_status` `zero`. That is a local reply, not a provider invoice.

A live reply stores `cost_status` `estimate`. The amount is reported input tokens times `AI_INPUT_USD_PER_MILLION`, plus reported candidate tokens and thought tokens times `AI_OUTPUT_USD_PER_MILLION`, divided by one million. It is an estimate from the operator's rates and the provider's reported token counts. It is not copied from an invoice.

If thought tokens are missing from the provider payload, the call is rejected as unpriced rather than recorded as a partial cost.

On 20 October 2026 the standard paid rates copied for `gemini-2.5-flash` were US$0.30 per 1M input text tokens and US$2.50 per 1M output tokens, including thinking tokens. Source: `https://ai.google.dev/gemini-api/docs/pricing`. The private environment holds those rates. The active budgets remain 0.

The pre-call check reserves the configured input-token cap plus output tokens and any configured thinking budget. For the prepared test that reservation is about US$0.0038. A process-wide lock stops a second overlapping Gemini call from passing the check. The US$0.10 proposal is not a hard ceiling: Google documents that a thinking budget can overflow, and the model output limit is 65,536 tokens.

If the provider omits token counts, the call is rejected as `ai_unpriced` and is not treated as free. A blocked live call stores `request_status` `blocked` and a null cost. Failed calls store `failed`.

The pre-call check uses the configured output-token cap and the output rate. It refuses the call when that estimate would pass either budget. The membership screen is not used, and this phase does not grant credits.

## Other controls

- The same idempotency key on one conversation returns the original assistant message and does not call the provider again.
- Provider HTTP errors return 502. Timeouts return 504. The response does not include the API key.
- Usage events logged by the API contain the provider, status, and cost status. They do not contain the conversation text.

No unattended job sends messages to a provider.
