# AI Usage and Cost Controls

Date: 20 October 2026.

Live model calls are off. No provider invoice was created while building this phase, and no live spend is recorded.

## Switches

| Variable | Default | Effect |
| --- | --- | --- |
| `AI_ALLOW_LIVE` | false | Must be exactly `true` before an OpenAI or Gemini call |
| `AI_PROVIDER` | `mock` | `openai` is preferred in the private environment. `gemini` remains selectable |
| `AI_MODEL` | empty | Required for a live call. The private file sets `gpt-5-mini`. Not hard-coded in source |
| `OPENAI_API_KEY` | empty | Server only, in `server/api/.env`. A missing key returns 503 and does not call the network |
| `GEMINI_API_KEY` | empty in the example | Used only when the provider is `gemini` |
| `AI_MAX_BUDGET_USD` | 0 | Development total. A live estimate above the remainder returns 429 |
| `AI_MAX_USER_BUDGET_USD` | 0 | Same check for one account |
| `AI_INPUT_USD_PER_MILLION` | empty | Required. Taken from a pricing page the operator has checked |
| `AI_OUTPUT_USD_PER_MILLION` | empty | Required. An empty price blocks the live call |
| `AI_MAX_OUTPUT_TOKENS` | 800 | OpenAI sends this as `max_output_tokens`. The private file sets 1024 |
| `AI_MAX_INPUT_TOKENS` | 4000 | Upper bound used only for the pre-call estimate |
| `AI_CACHED_INPUT_USD_PER_MILLION` | empty | Optional OpenAI cached-input rate. If empty, all input tokens use the standard input rate |
| `AI_THINKING_BUDGET` | 0 | Gemini only. OpenAI does not add this on top of `max_output_tokens` |
| `AI_MAX_LIVE_REQUESTS` | 0 | Successful and failed OpenAI and Gemini attempts share this cap. Zero blocks live calls |
| `AI_TIMEOUT_MS` | 20000 | Aborts the provider request. There is no retry |
| `AI_MESSAGE_RATE_LIMIT` | 30 | Messages per account per window |
| `AI_MAX_INPUT_CHARS` | 2000 | Rejects longer messages with 400 |

`.env.example` contains these names and empty prices. It does not contain a working key.

## How cost is recorded

Mock replies store `cost_usd` 0 and `cost_status` `zero`. That is a local reply, not a provider invoice.

A live reply stores `cost_status` `estimate`, the model, reported input and output tokens, `duration_ms`, and request status. The amount is calculated from the operator's rates and the provider's reported token counts. It is not copied from an invoice. Rates are read from the environment and are not hard-coded in source.

For Gemini, the estimate is input tokens times the input rate, plus candidate tokens and thought tokens times the output rate. Missing thought tokens reject the call as unpriced.

For OpenAI, `output_tokens` already includes reasoning tokens, so reasoning tokens are recorded and are not added again. Cached input tokens use `AI_CACHED_INPUT_USD_PER_MILLION` when that rate is set. Otherwise every input token uses the standard input rate, which overestimates a cached call. Missing input or output token counts reject the call as unpriced.

On 20 October 2026 the OpenAI pricing page listed standard `gpt-5-mini` text rates of US$0.25 per 1M input tokens, US$0.025 per 1M cached input tokens, and US$2.00 per 1M output tokens. Source: `https://developers.openai.com/api/docs/pricing`. The private environment holds those rates. Both budgets remain 0 and `AI_ALLOW_LIVE` remains false. The earlier Gemini rates, US$0.30 and US$2.50 per 1M, stay documented for the inactive adapter and are no longer the private environment's active rates.

The OpenAI pre-call reservation uses the configured input cap and `max_output_tokens`. At the private settings that is 4,000 input tokens and 1,024 output tokens, about US$0.003. A process-wide lock stops a second overlapping live call, whether the provider is OpenAI or Gemini, from passing the budget check. There is no automatic retry.

A strict US$0.10 maximum is not guaranteed. OpenAI documents that `gpt-5-mini` can emit up to 128,000 output tokens. The adapter sends `max_output_tokens` 1024, and the documented field includes reasoning tokens, but this project has not made a live call to prove the service honours that cap. If the cap were ignored, one response could exceed US$0.10. Live testing stays stopped until that limitation is accepted in a later approval.

If the provider omits token counts, the call is rejected as `ai_unpriced` and is not treated as free. A blocked live call stores `request_status` `blocked` and a null cost. Failed calls store `failed`.

The pre-call check uses the configured output-token cap and the output rate. It refuses the call when that estimate would pass either budget. The membership screen is not used, and this phase does not grant credits.

## Other controls

- The same idempotency key on one conversation returns the original assistant message and does not call the provider again.
- Provider HTTP errors return 502. Timeouts return 504. The response does not include the API key.
- Usage events logged by the API contain the provider, status, and cost status. They do not contain the conversation text.

No unattended job sends messages to a provider.
