# AI Stylist Live Test Plan

Date: 20 October 2026. Status: prepared, waiting for approval. No live OpenAI request has been sent. No live Gemini request has been sent.

The earlier Gemini preparation is inactive. Do not use it for the next live test.

## Prepared request

Provider: OpenAI. Model: `gpt-5-mini`.

Checked again on 20 October 2026 at `https://developers.openai.com/api/docs/models/gpt-5-mini`:

- Responses API: supported at `POST https://api.openai.com/v1/responses`.
- Structured outputs: supported.
- Text input and text output. The prepared call sends text only.
- Context window 400,000 tokens. Documented maximum output 128,000 tokens.
- Standard text rates on that page: input US$0.25 per 1M, cached input US$0.025 per 1M, output US$2 per 1M.

The adapter sends `text.format` of type `json_schema` with `strict: true`, which is the Responses form in `https://developers.openai.com/api/docs/guides/structured-outputs`. It sets `store` false, `reasoning.effort` to `minimal`, and `max_output_tokens` 1024. It does not send tools, web search, file search, or images. `usage.output_tokens` already includes reasoning tokens, so the cost estimate does not add them again.

Message:

"Suggest a stylish outfit for dinner at an upmarket restaurant in Johannesburg. My budget is R1,500. I prefer navy, black and ivory, and I don't like bright orange. Explain your choices."

Synthetic context, included only if this test is approved and only as preference text. It is not loaded from a customer account:

- Style: smart casual, modern minimalist.
- Preferred colours: navy, black, ivory.
- Avoided colour: bright orange.
- Budget: R1,500.
- Occasion: dinner at an upmarket restaurant.
- Location: Johannesburg.

No name, measurements, photographs, family records, or saved conversations are included.

## Controls that stay in place until approval

`server/api/.env` is gitignored and is not tracked. On this check it contains:

- `AI_PROVIDER=openai`
- `AI_MODEL=gpt-5-mini`
- `AI_ALLOW_LIVE=false`
- `AI_MAX_BUDGET_USD=0`
- `AI_MAX_USER_BUDGET_USD=0`
- `AI_MAX_OUTPUT_TOKENS=1024`
- `AI_MAX_INPUT_TOKENS=4000`
- `AI_MAX_LIVE_REQUESTS=1`
- The verified `gpt-5-mini` rates above
- `OPENAI_API_KEY` and `GEMINI_API_KEY` present as names only. Both values are empty.

There is no automatic retry. A failed or successful OpenAI or Gemini attempt counts toward the one-request cap. A second overlapping call is blocked before another fetch.

## Proposed ceiling

The proposed maximum for the one approved test is US$0.10. That amount is not active. Both budgets remain 0.

If OpenAI honours `max_output_tokens` 1024, the pre-call reservation is 4,000 input tokens plus 1,024 output tokens, about US$0.003. The code refuses the call when that estimate would pass either budget.

This is not a guarantee of US$0.10 or less. The model page says `gpt-5-mini` can emit up to 128,000 output tokens. At US$2 per 1M output tokens, that upper bound is about US$0.26 before input. This project has not made a live call to prove the service honours the requested cap.

## The first live request is not ready

1. Save a real `OPENAI_API_KEY` on the existing line in `server/api/.env`. Do not put it in `.env.example`, chat, or the React app. The saved file currently has an empty value.
2. Approve OpenAI, `gpt-5-mini`, and the fact that US$0.10 is a proposed ceiling rather than a measured guarantee.
3. For that one local run only, set both budgets to `0.10` and `AI_ALLOW_LIVE=true`, then set `AI_ALLOW_LIVE=false` and both budgets back to 0 immediately afterward.
4. Do not push or deploy.

## What to record after approval

- Latency, model id, input tokens, output tokens, cached tokens, and reasoning tokens.
- The estimate using the rates above.
- Whether the reply invented a product, a price, or a shop link.
- A human reading of the styling. Passing JSON validation is not a quality score.

## Human rubric

Score the live reply from 1 to 5 after it exists. Do not invent those scores now:

- Relevance.
- Use of the synthetic preferences only.
- A complete outfit.
- Budget awareness without a shop price.
- South African context.
- Natural tone.
- Practical advice.
- Valid structured fields.
- No invented retailer listing.

The live reply, once it exists, still will not decide commercial feasibility, retailer coverage, or try-on quality.
