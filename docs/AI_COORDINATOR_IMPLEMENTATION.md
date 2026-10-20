# AI Coordinator Implementation

Date: 20 October 2026.

The signed-in My Stylist screen talks to the existing Express API. The keyword stylist in `src/data/stylistKnowledge.ts` remains available as an explicitly labelled on-device demonstration. It is not used as a silent fallback.

## Modules

| Path | Responsibility |
| --- | --- |
| `server/api/src/ai/service.ts` | Conversations, messages, usage, and the request flow |
| `server/api/src/ai/specialists.ts` | Routing and the unconnected specialist replies |
| `server/api/src/ai/mockProvider.ts` | Deterministic local style replies |
| `server/api/src/ai/openaiProvider.ts` | Preferred live adapter. OpenAI Responses API with strict JSON schema. Inactive while live mode is off |
| `server/api/src/ai/geminiProvider.ts` | Gemini `generateContent` adapter. Kept available and inactive |
| `server/api/src/ai/schema.ts` | Validates a reply before it is stored or rendered |
| `server/api/src/ai/context.ts` | Minimises the profile when consent is on |
| `server/api/src/ai/guards.ts` | Blocks live calls that are unconfigured, unpriced, or over budget |
| `server/api/migrations/003_ai_conversations.sql` | Conversation, message, and usage tables |
| `server/api/migrations/004_ai_usage_duration.sql` | Adds `duration_ms` to usage rows |

The shopping lab and the FASHN lab are not imported.

## Routing

A message is classified with rules:

- Virtual try-on language goes to the try-on specialist, which returns `not_connected`.
- Makeup, hairstyle, or nails language goes to the beauty specialist, which returns `not_connected`.
- Buy, stock, product-link, or retailer language goes to the shopping specialist, which returns `not_connected` and a search intent. It does not invent a price or a product.
- Wardrobe-ownership language goes to the wardrobe specialist, which returns `not_connected`.
- Everything else goes to the style specialist.

The style specialist calls the configured provider. If `AI_PROVIDER` is unset, the provider is `mock`. The private environment sets `openai`.

## Routes

All of these require a session. Methods other than GET also require `x-csrf-token`.

| Method and path | Behaviour |
| --- | --- |
| `GET /api/stylist/availability` | Reports mock or live state, and that shopping, try-on, beauty, and wardrobe are not connected |
| `GET /api/stylist/usage` | The signed-in account's recent usage rows and summed cost |
| `GET /api/stylist/conversations` | That account's conversations |
| `POST /api/stylist/conversations` | Creates a conversation |
| `GET /api/stylist/conversations/:id` | Loads the conversation and its messages |
| `GET /api/stylist/conversations/:id/recommendations` | Returns the stored structured replies |
| `DELETE /api/stylist/conversations/:id` | Deletes the conversation and its messages |
| `POST /api/stylist/conversations/:id/messages` | Sends a message. Optional `x-idempotency-key` |

Another account receives 404. Messages are limited to `AI_MAX_INPUT_CHARS` (default 2000) and to `AI_MESSAGE_RATE_LIMIT` (default 30) per window.

## Reply contract

A stored recommendation has response text, recommendation type, specialist, availability, source (`mock` or `live`), outfit components, colours, accessories, budget guidance, occasion, follow-up questions, shopping search intent, and try-on or saved-look flags. Components that mention a price, stock, retailer, SKU, or URL are rejected. The screen builds a card only from that object and marks it `conceptOnly`, so it does not show a rand total, stock, or a shop link.

## Provider choice

Official documents checked on 20 October 2026:

- OpenAI model `gpt-5-mini` supports the Responses API and structured outputs. Context is 400,000 tokens and the documented maximum output is 128,000 tokens. Source: `https://developers.openai.com/api/docs/models/gpt-5-mini`.
- OpenAI structured outputs use `POST https://api.openai.com/v1/responses` with `Authorization: Bearer`, `text.format.type` of `json_schema`, `strict: true`, and `additionalProperties: false`. Source: `https://developers.openai.com/api/docs/guides/structured-outputs`.
- `max_output_tokens` bounds visible output and reasoning tokens together. `usage.output_tokens` already includes `output_tokens_details.reasoning_tokens`. `store` can be false. `reasoning.effort` accepts `minimal`. Sources: the Responses create reference and the structured-outputs guide on the same date.
- Gemini structured output remains `POST https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent` with header `x-goog-api-key` and `generationConfig.responseMimeType` of `application/json`.

OpenAI is the preferred provider. The request sets `store` false, `reasoning.effort` to `minimal`, `max_output_tokens` from `AI_MAX_OUTPUT_TOKENS`, and no tools. The model id comes from `AI_MODEL`. The Gemini adapter stays in the repository and is selected only when `AI_PROVIDER=gemini`. Neither provider is called unless the live switch, credential, model, prices, and budgets all allow it. Photographs and measurements are not included. Consent off sends no profile.

## Retention

Deleting a conversation removes its messages through the foreign key. Usage rows remain so the budget can still be counted, and they do not contain the message text. There is no export endpoint yet. A production launch still needs a retention period and an export.
