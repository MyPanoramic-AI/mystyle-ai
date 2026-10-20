# AI Coordinator Implementation

Date: 20 October 2026.

The signed-in My Stylist screen talks to the existing Express API. The keyword stylist in `src/data/stylistKnowledge.ts` remains available as an explicitly labelled on-device demonstration. It is not used as a silent fallback.

## Modules

| Path | Responsibility |
| --- | --- |
| `server/api/src/ai/service.ts` | Conversations, messages, usage, and the request flow |
| `server/api/src/ai/specialists.ts` | Routing and the unconnected specialist replies |
| `server/api/src/ai/mockProvider.ts` | Deterministic local style replies |
| `server/api/src/ai/geminiProvider.ts` | Gemini `generateContent` adapter, used only when live mode is allowed |
| `server/api/src/ai/schema.ts` | Validates a reply before it is stored or rendered |
| `server/api/src/ai/context.ts` | Minimises the profile when consent is on |
| `server/api/src/ai/guards.ts` | Blocks live calls that are unconfigured, unpriced, or over budget |
| `server/api/migrations/003_ai_conversations.sql` | Conversation, message, and usage tables |

The shopping lab and the FASHN lab are not imported.

## Routing

A message is classified with rules:

- Virtual try-on language goes to the try-on specialist, which returns `not_connected`.
- Makeup, hairstyle, or nails language goes to the beauty specialist, which returns `not_connected`.
- Buy, stock, product-link, or retailer language goes to the shopping specialist, which returns `not_connected` and a search intent. It does not invent a price or a product.
- Wardrobe-ownership language goes to the wardrobe specialist, which returns `not_connected`.
- Everything else goes to the style specialist.

The style specialist calls the configured provider. The default provider is `mock`.

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

- Gemini structured output: `POST https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent` with header `x-goog-api-key` and `generationConfig.responseFormat.text.mimeType` of `APPLICATION_JSON`. Source: `https://ai.google.dev/gemini-api/docs/generate-content/structured-output`.
- OpenAI structured outputs: Responses API `text.format` of type `json_schema` with `strict: true`. Source: `https://developers.openai.com/api/docs/guides/structured-outputs`.

Gemini is the first live adapter because the repository already reserved a server-side Gemini key and the documented API accepts a JSON schema. The model id is `AI_MODEL`. No model name is hard-coded. OpenAI was not implemented. Neither provider is called unless the live switch, credential, model, prices, and budgets all allow it.

## Retention

Deleting a conversation removes its messages through the foreign key. Usage rows remain so the budget can still be counted, and they do not contain the message text. There is no export endpoint yet. A production launch still needs a retention period and an export.
