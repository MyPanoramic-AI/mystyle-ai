# AI unit economics

Date: 21 October 2026. Nothing in this note is a measured cost or a forecast that should be used for pricing.

## Two different units

A customer credit is an internal integer. A provider cost is an external amount, normally in US dollars. This phase does not define a conversion between them.

One credit is not one dollar. One text reply is not priced as one image. OpenAI text usage and FASHN image usage stay in separate `provider_costs` rows, distinguished by `provider` and `operation_type`.

## What a mock operation records

A test reservation writes:

- the account and operation id
- provider `mock`
- operation type `text` or `image`
- `credits_consumed` only after a confirmed success
- `reported_cost_minor` and `estimated_cost_minor` left null
- `cost_status` `unavailable`
- `request_status` `reserved`, `succeeded`, `failed`, or `unknown`

No dollar amount is invented when the provider does not report one. The existing stylist usage log is unchanged: mock calls stay at cost status `zero`, and live calls stay blocked.

## What is not known

- The approved number of credits for a text reply or an image.
- The approved rand price of any plan.
- The current OpenAI or FASHN invoice price for a real request. Earlier notes quoted public token prices for planning. Those quotes were not verified with a bill, and they are not reused here as a result.
- Whether unused credits should roll over or expire.
- How a Family allowance would be shared.

`GET /api/usage/summary` returns the signed-in account's operation rows, including the null cost fields. `GET /api/admin/usage` returns counts and sums. A sum of null costs stays null. It is not shown as zero dollars.

No OpenAI, Gemini, or FASHN request was made to produce this note.
