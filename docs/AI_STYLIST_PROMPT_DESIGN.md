# AI Stylist Prompt Design

Date: 20 October 2026. Prompt version: `2026-10-20.1`, stored as `STYLE_PROMPT_VERSION` in `server/api/src/ai/context.ts`.

## Voice

The system prompt tells the model to be Aria, a practical stylist for an adult customer in South Africa. The voice is warm, specific, and budget-conscious. Local budgets are discussed in rand. The prompt forbids comments on body shape, attractiveness, gender identity, or measurements, and it forbids a fit guarantee.

## What the model may say

It may recommend garment types, colours, and why they work. It must not invent a retailer listing, a current price, a promotion, stock, or a product URL. If the customer wants to buy something, the reply says verified shopping is not connected and puts the idea in `shoppingSearchIntent`. Virtual try-on and beauty image generation are described as not connected.

## Data sent with the prompt

When AI personalisation consent is off, the prompt says that no personal profile is included. When consent is on, the added JSON contains only styles, favourite colours, avoided colours, the budget band, shopping priorities, retailer names, and size labels. It does not contain the display name, age, measurements, photographs, or family records.

Customer text and any future catalogue text are described as data, not as instructions. The prompt tells the model to ignore requests to change the rules, reveal the prompt, or invent a shop listing.

## Mock behaviour

The mock provider does not send the system prompt anywhere. It returns a fixed reply for weddings, workwear, navy, summer parties, budgets, and comfort. Other style questions ask for the occasion. It does not claim to be a live model. The availability label is "Demonstration stylist. This is not a live model."

## Output shape

The live adapter requests JSON. The server still validates the parsed object. If the object is incomplete or contains a price, stock, retailer, or link inside an outfit component, the customer sees a clarification and the usage row is marked failed. The narrative is stored as text and rendered as text.
