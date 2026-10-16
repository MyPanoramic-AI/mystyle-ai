# MyStyle AI — Project Overview

Audit date: 16 October 2026.

This document records what the repository is today. Proposed production work is in the other files under `docs/`. Nothing in this overview claims that live AI, payments, or retailer integrations exist.

## Product intent

MyStyle AI is intended to become a commercial personal fashion, beauty, virtual try-on, and smart-shopping product for adult customers in South Africa. Prices are expressed in South African rand. The interface is a responsive web application with a mobile-first bottom navigation bar and a wider desktop layout.

The exported project is a Google AI Studio frontend prototype. It is not a production system.

## What was exported

- A React 19 and TypeScript client built with Vite.
- Tailwind CSS 4, applied through `@tailwindcss/vite`.
- Editorial styling: Playfair Display, Plus Jakarta Sans, and the existing warm palette (`#F6F2EC`, `#E5CDBE`, `#9C6A61`, `#B49361`, `#242326`).
- Sixteen fashion and beauty photographs under `src/assets/images/`, plus a parallel copy under `public/images/`.
- Screen flows for onboarding, home, stylist chat, discovery, virtual try-on, shop, family styling, beauty, wardrobe, membership, and account settings.
- Browser `localStorage` services for profile, family, wardrobe, beauty saves, saved looks, saved products, and simulated membership.
- `express`, `dotenv`, and `@google/genai` listed in `package.json`.

## What this audit verified

- There is no `server.js` and no Express application in the source.
- `@google/genai` is not imported anywhere under `src/`.
- `GEMINI_API_KEY` is documented in `.env.example` and `README.md`, and it is not read by the frontend.
- Stylist replies, shop prices, try-on results, beauty previews, subscriptions, and AI credits are demonstration behaviour.
- Photographs chosen during onboarding are kept as in-memory `blob:` URLs. They are not written to `localStorage` by `profileService`.
- Customer style data, body measurements, family profiles (including demonstration child profiles), wardrobe records, and account fields are written to `localStorage` in the browser.

## Repository condition at audit start

- The folder was not a Git repository. There was no commit history to preserve.
- There was no lockfile.
- There was no automated test suite.
- `CURSOR_HANDOVER.md` describes the prototype and recommends a later backend. Several statements in that handover do not match the exported `package.json` or the shop code. Those differences are recorded in `CURRENT_ARCHITECTURE.md`. The handover file has been kept.

## Preservation rules in force

The existing React and Vite frontend, navigation, colour palette, components, and images stay. Production work replaces demonstration services behind the current service boundaries. It does not start with a framework rewrite.

## Current conclusion

The prototype is a coherent, buildable user interface with local demonstration data. It is not production-ready. No paid AI call and no retailer integration was made during this audit.
