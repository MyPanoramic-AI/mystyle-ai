# AI credit accounting (virtual try-on)

## Two credit systems

| System | Unit | Meaning |
| --- | --- | --- |
| Membership ledger | Internal test/customer credits | Reserved via `reserveCredits` with `featureKey: 'ai.image'` |
| FASHN API | Provider credits (~$0.075 on-demand) | Reported by FASHN; tracked via job spend / budget USD |

Do **not** equate them 1:1 without a commercial policy. `TRYON_CUSTOMER_CREDIT_COST` sets the internal reservation amount (default 1).

## Live try-on ledger flow

1. Entitlement must include `ai.image` (FREE does not).
2. Atomic reserve before provider call (`operationType: tryon.generate`).
3. Success → settle consume.
4. Failure / cancel → settle release.
5. Idempotency key prevents duplicate reserves for the same job create.
6. Provider USD budget (`TRYON_MAX_BUDGET_USD`) is a separate hard gate.

## Not activated

- Public plan entitlement changes
- Payments / subscriptions
- Automatic FASHN credit purchases
