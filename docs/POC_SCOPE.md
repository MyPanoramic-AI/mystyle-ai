# Proof-of-Concept Scope

The controlled proof of concept exists to answer two technical questions and then to hold a small adult pilot. It is not the commercial launch.

## In scope

- The existing React and Vite interface, preserved.
- A Node.js and Express API with SQLite and private file storage.
- Adult registration and a style profile.
- One virtual try-on provider experiment, then a server job if the experiment passes.
- One licensed South African catalogue experiment, then shop results only from that catalogue.
- A coordinator that can call style text, try-on, and shopping with the contracts in `AI_INTEGRATION_PLAN.md`.
- Credit ledger and a manual entitlement flag for invited accounts.
- Cost and error records for every provider call.
- POPIA-oriented basics: consent records, export, and deletion for the adult account and their photographs.

## Out of scope

- PostgreSQL, PocketBase, Kubernetes, and a mobile application.
- Live card payments, PayFast, Stripe, and app-store billing. Plans on screen stay labelled as demonstration until Phase 9.
- Scraping retailer websites as the product search engine.
- Sending any customer or test photograph to a provider before the Phase 2 protocol is approved.
- Processing photographs or measurements of children. The current family screens may keep their local demonstration data. They are not connected to the proof-of-concept API.
- Generative hairstyle, makeup, and nail rendering.
- A human stylist concierge, WhatsApp, or push notifications.
- Rewriting the visual design, replacing Tailwind, or replacing Vite.
- Deleting demonstration modules before the real replacement for that module is accepted.

## Users

Invited adults who can consent for themselves. No public signup during the proof of concept. No school, family-child, or minor try-on mode.

## Success looks like

- An invited adult can sign in, save a profile, upload their own photograph, and delete it.
- A try-on job either returns the provider image with a recorded duration and cost, or a recorded failure.
- A shop search returns licensed rows with URLs and verification times, or an empty state. It never fills a gap with a language-model price.
- The existing screens that are not yet connected still behave as they do today.

## Failure looks like

- Treating this prototype's `localStorage` credits, prices, or stylist cards as production truth.
- Announcing a retailer integration that Phase 3 did not verify.
- Uploading a child's image because the family screen already has a try-on button.
