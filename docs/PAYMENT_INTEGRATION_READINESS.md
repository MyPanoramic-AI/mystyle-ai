# Payment integration readiness

Date: 21 October 2026. No payment provider is integrated. No card number, card token, or bank detail is collected or stored.

## What exists

- Versioned plan rows with provisional rand amounts.
- A server entitlement row that a customer cannot change.
- An integer credit ledger with reservation, settlement, release, refund, and expiry.
- An operator route that can assign a test entitlement. The assignment is audited and is marked as a test, not as a payment.
- Billing and credit integration boundaries remain `not_connected`.

## What does not exist

- A checkout page, a PayFast or other acquirer client, a webhook, an invoice, a tax calculation, or a dunning state.
- A customer route that starts Personal or Family.
- A public purchase or top-up route.
- Automatic paid credit grants. `paid_allocation_enabled` is 0.
- `trial` and `past_due` handling.

The membership Preview buttons still update browser demonstration state only. They do not call the assignment route.

## Before a real charge can be considered

1. The owner chooses an acquirer and a test merchant account.
2. Prices, VAT, and the monthly credit allowances are approved. The current R0, R99, and R179 figures, and the 2, 15, and 40 credit figures, are not approvals.
3. Rollover, expiry, upgrade, downgrade, and cancellation behaviour are approved. They are configurable and currently undecided.
4. Webhook signatures, idempotency, and a reconciliation job are designed against that acquirer. A webhook must not trust a browser success message.
5. Personal data in the payment record is limited to what the acquirer requires. Raw card data stays on the acquirer's page.
6. A failed or unknown provider job has a written rule for when a credit hold may be released.
7. The membership screen stops presenting demonstration cards as if they were the product being sold.
8. The change is tested with the acquirer's sandbox. It is not enabled by deploying the current build.

Until those steps are done, no route should report a successful payment.
