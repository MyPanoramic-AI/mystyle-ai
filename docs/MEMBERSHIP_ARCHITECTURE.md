# Membership architecture

Date: 21 October 2026. This is an accounting foundation. It is not a payment system and it does not sell a subscription.

## Plan definitions

Three published version 1 definitions live in `plan_definitions`. Display copy is separate from the entitlement keys the server enforces.

| Code | Display name | Indicative monthly price | Interval | Entitlement keys | Proposed monthly credits | Family capability |
| --- | --- | --- | --- | --- | --- | --- |
| `FREE` | Free | R0 | none | `account.basic` | 2 | No |
| `PERSONAL` | Personal | R99 | month | `account.basic`, `ai.text`, `ai.image` | 15 | No |
| `FAMILY` | Family | R179 | month | those Personal keys, plus `family.managed` | 40 | Yes, as one account |

Every row is `price_status = provisional` and `allowance_status = unapproved`. The prices are not live offers. The 2, 15, and 40 credit figures are unapproved demonstration assumptions. They are not granted when an account is created and they are not granted by the monthly runner while the allowance stays unapproved.

The existing membership cards still show Discovery, Signature, and Private Atelier. Those cards are a browser demonstration. They are not the server plan catalogue.

## Entitlements

`subscription_entitlements` is the server record. A new account receives one `FREE` row with status `active`, source `registration`, and only `account.basic`. That row is not a paid subscription. Customer responses include `paid: false`.

An operator with the admin bearer token can replace the active row for a test. The previous active row is marked `cancelled` inside the same transaction. A Personal or Family assignment from that route is an `admin_test` record. It is not evidence that a payment occurred.

Statuses used: `inactive`, `active`, `cancelled`, `expired`. `trial` and `past_due` are not used because there is no payment provider that could create them.

Spending requires an `active` row whose window includes the current time and whose feature keys include the requested feature. A cancelled or expired row cannot reserve credits. A later read does not recreate a free row after a cancellation, so cancellation stays in force.

## What a customer can change

`POST /api/entitlements` and `POST /api/credits/allocate` answer 403. Preview on the membership screen writes only the existing browser `localStorage` demonstration. It does not call an assignment route.

## Family

A Family plan is one account. Creating the plan does not create extra users and does not turn a dependent profile into a subscriber. A reservation that asks for `family.dependent` is rejected. Child profiles have no credit endpoint.

These sharing options are not implemented and are not approved:

- One allowance managed by the account holder.
- Sharing by another authorised adult on the same account.
- A per-member usage boundary.

## AI boundary

`prepareAuthorizedOperation` checks the entitlement, reserves integer credits, and refuses any provider other than `mock`. The stylist, shopping lab, and try-on lab do not call it. OpenAI, Gemini, and FASHN remain disabled.

## Monthly processing

`POST /api/admin/billing/run` walks active entitlements. It grants nothing while `allowance_status` is `unapproved`. It also grants nothing for Personal or Family while `paid_allocation_enabled` is 0. The default policy row keeps that flag at 0.

The same period key cannot be inserted twice. Repeating the run does not add a second grant. Upgrade, downgrade, and cancellation replace the entitlement row and do not claw credits back, because rollover is `undecided`. An expired or cancelled row is skipped.

Credit expiry runs only when an operator sets `expiry_policy` to `expire_after_period`. The default is `undecided`, and that setting expires nothing. There is no external scheduler.
