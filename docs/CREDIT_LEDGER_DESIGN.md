# Credit ledger design

Date: 21 October 2026. Customer credits are integer product units. They are not rands and they are not US dollars.

## Balance

The spendable balance is `SUM(credit_ledger.delta)` for that account. A movement stores `resulting_balance` as a projection of that sum. The projection is written in the same transaction as the delta. A reservation that would make the sum negative is rejected before it is inserted.

Floating-point amounts are rejected. Zero and negative allocations are rejected. An adjustment must be a non-zero integer and cannot push the sum below zero.

## Entry types

| Type | Delta | When it is written |
| --- | --- | --- |
| `ALLOCATION` | positive | An operator records a test grant for one period, or a future approved monthly run grants an approved allowance |
| `RESERVATION` | negative | Credits are held before a mock operation |
| `CONSUMPTION` | zero | The operation is confirmed. The hold already reduced the balance |
| `RELEASE` | positive | A reserved hold is cancelled, or an unknown hold is released only after `confirmNotBillable` |
| `REFUND` | positive | An operator refunds a row that is already `consumed` |
| `EXPIRATION` | negative | The expiry policy is `expire_after_period` and the period end has passed |
| `ADMIN_ADJUSTMENT` | signed | An operator correction that still leaves the balance at zero or above |
| `LEGACY` | unchanged | Rows that existed before this migration. None are seeded |

Each row stores the account id, an operation id, the type, the integer delta, a reason, a timestamp, and the resulting balance. The operation id links a provider-cost row when one exists.

## Reservation and settlement

The sequence is one SQLite `BEGIN IMMEDIATE` transaction:

1. Reject a repeated idempotency key and return the first result.
2. Require an active entitlement and the requested feature key.
3. Reject the hold when the posted balance is smaller than the amount.
4. Insert the negative `RESERVATION` and a `credit_reservations` row with status `reserved`.
5. Insert a `provider_costs` row with no cost figures and `cost_status = unavailable`.

Settlement then:

- `success` writes `CONSUMPTION` with delta 0 and marks the reservation `consumed`. A second success is a duplicate and does not debit again.
- `failed` writes `RELEASE` and marks the reservation `released`.
- `unknown` marks the reservation `unknown` and does not return the credits. A timeout is this case. A later release requires `confirmNotBillable: true`, because the external job might still complete and be billable.

## Idempotency and concurrency

`credit_idempotency` stores the first response for an account, scope, and key. The same key does not append another delta. The same billing period cannot be allocated twice, even with a new key.

Concurrent holds use `BEGIN IMMEDIATE` and `PRAGMA busy_timeout`. A file-database test holds the write lock in one connection, posts an 8-credit hold against a 10-credit balance, and lets a second connection try another 8-credit hold. The second hold is rejected and the balance stays 2.

## Policies that are not decided

`billing_policies` starts as rollover `undecided`, expiry `undecided`, and paid allocation off. An operator can set rollover to `none` or `rollover`, and expiry to `none` or `expire_after_period`, for a test database. Those settings are not an approved commercial policy. Paid monthly grants stay off unless that flag is explicitly enabled in a test.
