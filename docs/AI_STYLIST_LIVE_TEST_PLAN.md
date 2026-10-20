# AI Stylist Live Test Plan

Date: 20 October 2026. Status: not started. This document is the approval request. It does not authorise a paid call.

## What is already true

The mock coordinator, schema checks, consent gate, and budget gate have automated tests. Those tests do not measure a live model's fashion quality. A synthetic Gemini HTTP response is used only inside the test process. No request was sent to Google or OpenAI.

## Before the first live call

1. The owner chooses Gemini or another provider in writing.
2. The owner names a current model id and sets `AI_MODEL` to that id.
3. The owner copies input and output prices from the provider's pricing page into `AI_INPUT_USD_PER_MILLION` and `AI_OUTPUT_USD_PER_MILLION`, and records the page URL and the date.
4. The owner sets `AI_MAX_BUDGET_USD` and `AI_MAX_USER_BUDGET_USD` to the approved ceiling. The suggested first ceiling is one cheap text reply, confirmed from that pricing page. This plan does not invent that dollar amount.
5. The owner places `GEMINI_API_KEY` in the server environment, not in React and not in `.env.example`.
6. The owner sets `AI_ALLOW_LIVE=true` only for that test, then sets it back to false.
7. The test account is an adult test account. AI personalisation consent is turned on only if the owner also approves sending that account's style labels. Measurements and photographs stay excluded by the server.
8. Nobody starts a background job, a retailer sync, or a FASHN generation as part of this test.

## What to record

- The model id returned with the message.
- The token counts and the estimated cost row.
- Whether the reply invented a price, a stock state, or a product link.
- Whether a wedding, workwear, budget, and "buy this" prompt behaved as intended.
- The provider error text with the key removed, if the call fails.

## What this test will not decide

It will not decide commercial feasibility, retailer coverage, or try-on quality. Those stay on their own approval gates.

## Human rubric for a later review

Score each live reply from 1 to 5, and do not copy those scores from the mock:

- Relevance to the request.
- Use of consented preferences, or a clear absence of personal data when consent is off.
- Practical garment advice.
- Respect for the named budget without inventing a shop price.
- Warm, plain tone.
- No repeated question that the customer already answered.
- No comment on body, attractiveness, or identity.
- Truthful statement that shopping and virtual try-on are not connected.
