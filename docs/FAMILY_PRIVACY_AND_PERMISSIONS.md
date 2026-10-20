# Family privacy and permissions

A family profile is a planning record owned by one adult account. It is not an account of its own.

## What the account holder can do

The signed-in adult can add, view, edit, and remove profiles, and can include those profiles in a family event plan. Removal asks for confirmation in the browser. A dependent profile is stored with `permission_level` `viewer`. Sending `editor` for a dependent returns 400. There is no family login, invitation, shared password, or delegated editor in this phase. The existing permission columns remain for a future review. They do not grant access today.

## What a dependent record is

A dependent profile can hold a display name, relationship, optional size labels, colours, styles, and a planned budget. It cannot authenticate. The API returns `canAuthenticate: false`. The server refuses `photo`, `photograph`, `image`, `imageBase64`, `mediaId`, `dateOfBirth`, and `birthDate` on family requests. Media purposes containing child, minor, or dependent were already refused.

The account holder's own style profile is not copied onto a new family profile.

## What stays off external services

Family profiles are not added to the stylist context. `familyPlanningBoundary` excludes dependents and photographs and is not wired to OpenAI, Gemini, FASHN, or a retailer connector. Family events do not create payments or assume that clothing was bought. Logs for this feature do not include family names or notes.

## Outstanding legal requirements

Before any expansion, the product still needs:

- A recorded privacy notice that explains an adult is storing another person's planning details.
- A decision, with legal review, on whether dependent profiles should remain in the commercial product.
- An account export and deletion path that includes family profiles and event plans.
- A retention rule for family records.
- Confirmation that dependent information is not transferred to a model provider, a try-on provider, or a retailer.
- A separate review before any photograph, measurement inference, marketing use, or behavioural profile is considered.

None of those expansions is enabled in this phase.
