# AI Integration Plan

Status: the stylist coordinator is implemented in `server/api/src/ai` and the signed-in My Stylist screen calls it. The code default, when `AI_PROVIDER` is unset, remains the deterministic mock. The private server environment now prefers OpenAI (`AI_PROVIDER=openai`, `AI_MODEL=gpt-5-mini`) with `AI_ALLOW_LIVE=false` and both budgets at 0. The Gemini adapter remains in the tree and is inactive. No live OpenAI or Gemini request has been made. Shopping, virtual try-on, beauty, and wardrobe specialists return `not_connected`.

The original design below is kept as the target shape. The implemented routes are `/api/stylist/*`, not `POST /api/assistant/tasks`.

## What exists now

`generateStylistResponse` in `src/data/stylistKnowledge.ts` is a local keyword map. It returns prepared text, outfit cards, and beauty tips. The delay in `StylistChatScreen.tsx` is a 600 ms timeout. `@google/genai` is installed and unused. Virtual try-on generation does not exist.

## Coordinator

A server-side coordinator receives a typed request and delegates to one specialist. It does not answer shopping questions from model memory.

```
Client (existing stylist, try-on, shop, beauty, wardrobe screens)
        |
        v
POST /api/assistant/tasks
        |
        v
Coordinator
  - identifies the signed-in adult
  - checks permission and credit policy
  - classifies the task
  - calls one specialist
  - validates the specialist output against a schema
  - persists the exchange and the cost
        |
        +-- Style Intelligence
        +-- Virtual Try-On
        +-- Shopping Intelligence
        +-- Beauty Intelligence
        +-- Wardrobe Intelligence
        +-- Profile Intelligence
```

Classification can be a small set of rules at first (the screens already know whether the user pressed Try On or Shop). A model router is optional later. The originating screen's intent is a better signal than re-inferring it.

## Specialist contracts

Each specialist returns JSON that fails validation if required fields are missing. Free text is allowed only in designated narrative fields.

### Style Intelligence

Input: profile summary, occasion, budget band, and optional wardrobe item ids.

Output: rationale, silhouette notes, and a list of garment descriptions. A garment description is not a retailer offer. It must not include a price, a stock flag, or a product URL unless Shopping Intelligence attached a verified offer.

### Virtual Try-On

Input: person media id, garment media id or licensed product image id, and the selected provider adapter.

Output: job id, then a result media id, provider, model, duration, and cost. The image bytes are stored by the media module. The coordinator returns an authenticated URL, not a permanent public URL.

Provider adapters implement one interface: `submit`, `poll`, `priceQuote`. FASHN and Google Cloud are candidates. See `VIRTUAL_TRYON_FEASIBILITY.md`. The adapter is chosen by configuration, not by hard-coding a vendor into the React screen.

### Shopping Intelligence

Input: a structured query (category, colour, size, budget, retailer allow-list).

Output: only rows from the catalogue store. Each row includes source, source URL, price, currency, and `verifiedAt`. If the catalogue has no match, the output is an empty list and a narrative that says no verified offer was found.

The coordinator rejects any model-written offer that lacks a `catalogueItemId`.

### Beauty Intelligence

Input: occasion and the adult's stated preferences. No requirement to upload a face for the first text suggestions.

Output: description of hair, makeup, and nails. Image generation is a separate, later adapter with its own consent and credit cost. The current beauty screen must keep showing curated images until that adapter has been tested.

### Wardrobe Intelligence

Input: the caller's wardrobe item ids.

Output: outfit combinations that reference those ids. It must not invent owned garments. Gaps are phrased as needs ("a neutral belt") and are passed to Shopping Intelligence only when the user asks to shop.

### Profile Intelligence

Input: the stored adult profile and, later, family context the account is allowed to use.

Output: a short preference summary for the other specialists. For the proof of concept this summary is the adult account only. Child profiles are not sent to a model.

## Provider independence

```
interface TextProvider {
  complete(input: { system: string; messages: Message[]; schema: JsonSchema }): Promise<JsonValue>
}

interface TryOnProvider {
  quote(input: TryOnRequest): Promise<{ maxCostMinor: number; currency: string }>
  start(input: TryOnRequest): Promise<{ providerJobId: string }>
  fetch(providerJobId: string): Promise<TryOnProviderResult>
}
```

Configuration names the active text provider and the active try-on provider. OpenAI is the preferred text provider and is implemented behind the live switch. Gemini remains selectable with `AI_PROVIDER=gemini` and is inactive. Neither provider is the try-on engine. Try-on uses a specialist image provider.

## Controls

| Control | Rule |
| --- | --- |
| Permission | Every task carries an account id. Media ids are loaded only if that account owns them |
| Adult only | Try-on and beauty image jobs refuse a subject flagged as a child |
| Credits | The server debits a credit only after a successful chargeable result, or records a zero-cost failure. The current client-side ledger is not authoritative |
| Spend ceiling | A daily cap in rand or US dollars stops new provider calls. Operators can see the cap in the admin module |
| Retries | Retry network failures and HTTP 429 with backoff. Do not retry a content-policy rejection as if it were a timeout |
| Rate limit | Per account and per provider |
| Timeouts | Text tasks and try-on jobs have separate limits. The UI shows failed, not a fake image |
| Logging | Request id, provider, model, latency, token or credit usage, and error class. No prompts that contain measurement dumps in info logs if a redacted copy will do, and never image bytes |
| Evaluation | Save the structured output. A later review can score identity retention and offer accuracy without re-calling the provider |

## Relationship to the current stylist

The Aria chat UI can remain. Its send handler should eventually post the user text to the coordinator and render the validated cards. Until that service exists, `generateStylistResponse` stays in place so the prototype does not lose its demonstration chat.

Scripted outfit prices must stay visually marked as demonstration prices, which the shop screen already does more clearly than the stylist cards.

## Try-on lab adapter

The first executable try-on boundary is `server/tryon-lab`, not the consumer Try On screen. `TryOnProvider` in `server/tryon-lab/src/providers/types.ts` is the adapter the future coordinator should call. The mock adapter runs locally. The FASHN adapter builds the documented `/v1/run` body and polls `/v1/status/{id}`, and it refuses to send traffic unless `TRYON_ALLOW_LIVE=true`, the request sets `approveLiveCall`, a server-side key exists, and the USD budget covers the estimate. Google `virtual-try-on-001` is listed as unavailable because its Agent Platform deprecation date, 14 September 2026, has passed. The consumer UI still uses the demonstration alert.
