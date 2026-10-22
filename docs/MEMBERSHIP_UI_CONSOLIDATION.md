# Membership UI consolidation

Date: 22 October 2026.

## Problem

Signed-in customers previously saw both:

1. Server Free entitlement + test credit ledger
2. Browser `membershipService` demonstration plans, renewal dates, and top-ups

## Account mode behaviour

| Surface | Source of truth |
| --- | --- |
| Current membership | `/api/entitlements` |
| Credit balance | `/api/credits` test ledger |
| Available plans | `/api/plans` provisional definitions |
| Preview | Local UI state only — no entitlement or credit mutation |

Preview buttons cannot assign paid plans or allocate credits. Cancel/resume and top-up purchase paths are disabled for account mode. Provisional prices stay labelled. No fake payment success.

## Demo mode

Browser demonstration membership remains available only when browsing without an account, and stays clearly labelled.
