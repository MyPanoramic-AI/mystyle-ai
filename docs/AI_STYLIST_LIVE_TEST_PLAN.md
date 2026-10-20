# AI Stylist Live Test Plan

Date: 20 October 2026. Status: inactive. Prompt 6.2 selected OpenAI as the preferred provider. This Gemini plan must not be used for the next live test. No live Gemini request has been sent.

## Prepared request

Provider: Gemini. Model: `gemini-2.5-flash`, still listed as a stable model at `https://ai.google.dev/gemini-api/docs/models/gemini-2.5-flash`. That page also says access to 2.5 models is limited to accounts that have used them. This project cannot confirm that the configured key has access without making a live call.

The request is one text-only `generateContent` call. It does not enable tools, search grounding, or image input. Structured output uses `generationConfig.responseMimeType` of `application/json` and `responseSchema`, which is the REST form shown for Gemini 2.5. `maxOutputTokens` is 1024. `thinkingConfig.thinkingBudget` is 0. The adapter reads `promptTokenCount`, `candidatesTokenCount`, and `thoughtsTokenCount`.

Message:

"Suggest a stylish outfit for dinner at an upmarket restaurant in Johannesburg. My budget is R1,500. I prefer navy, black and ivory, and I don't like bright orange. Explain your choices."

Synthetic context, included only if this test is approved and only as this text. It is not loaded from a customer account:

- Style: smart casual, modern minimalist.
- Preferred colours: navy, black, ivory.
- Avoided colour: bright orange.
- Budget: R1,500.
- Occasion: dinner at an upmarket restaurant.
- Location: Johannesburg.

No name, measurements, photographs, family records, or saved conversations are included.

## Pricing checked on 20 October 2026

Source: `https://ai.google.dev/gemini-api/docs/pricing`, standard paid tier for `gemini-2.5-flash`.

- Input, text: US$0.30 per 1M tokens.
- Output, including thinking tokens: US$2.50 per 1M tokens.
- Free tier is listed as free of charge and may be used to improve Google's products. A billed key should be costed at the paid rates.

The private `server/api/.env` has these rates, `AI_ALLOW_LIVE=false`, and both budgets at 0. `AI_MAX_LIVE_REQUESTS=1`. There is no automatic retry. A failed or successful Gemini attempt counts toward that cap. A second overlapping call is blocked before another fetch. `GEMINI_API_KEY` is not configured. The FASHN key was not copied.

## Proposed ceiling

The proposed maximum for the one approved test is US$0.10. That amount is not active. Both budgets remain 0 until approval.

The code reserves an estimate of 4,000 input tokens plus 1,024 output tokens at the rates above, about US$0.0038, and refuses the call when that estimate would pass the budget. It also sends `thinkingBudget` 0 and does not send grounding tools.

This is not a guarantee that Google will bill US$0.10 or less. Google's thinking documentation says a thinking budget can overflow, and output tokens can reach the model limit of 65,536. At US$2.50 per 1M output tokens, 65,536 tokens would be about US$0.16 before input. The stable model documents that `thinkingBudget` 0 disables thinking, but that has not been confirmed with a live call on this account.

## Still required before the call

1. The owner approves Gemini, `gemini-2.5-flash`, and the US$0.10 ceiling in writing.
2. The owner adds `GEMINI_API_KEY` to `server/api/.env` only.
3. For that one local run, set both budgets to `0.10` and `AI_ALLOW_LIVE=true`, then set `AI_ALLOW_LIVE=false` and both budgets back to 0 immediately afterward.
4. Do not push or deploy.

## What to record after approval

- Latency, model id, prompt tokens, candidate tokens, and thought tokens.
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
