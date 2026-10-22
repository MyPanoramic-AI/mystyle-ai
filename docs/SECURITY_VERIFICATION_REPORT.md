# Security verification report — Master QA

Date: 22 October 2026. Local isolated application only. No scans against public Render.

## Scope exercised

| Control | Result | Evidence |
| --- | --- | --- |
| Session cookie auth | PASS | `auth.test.ts`, e2e |
| CSRF on non-GET | PASS | Client retry test; mutating routes call `requireCsrf` |
| Origin checks | PASS | Foreign origin rejected |
| Account isolation / IDOR | PASS | isolation, wardrobe, family, beauty, media, AI, wishlist tests |
| Password hashing / reset neutrality | PASS | email-security tests (unknown email neutral) |
| Email verification token single use | PASS | concurrent verification test |
| Rate limiting on auth | PASS | auth rate-limit test |
| Admin routes without token | PASS | 503/401 when unset/wrong |
| Customers cannot assign plans/credits | PASS | membership tests |
| Private media owner-only | PASS | media + profile-photos |
| Child media purpose refused | PASS | media test |
| Export/download owner-only | PASS | privacy tests |
| Account deletion re-auth | PASS | privacy tests |
| Stack traces / path leakage on DB fail | PASS | infrastructure tests |
| Live AI without key/budget | PASS (blocked) | ai tests |
| Live FASHN without approval | PASS (blocked) | tryon tests |
| Media path containment | PASS after MQ-006 | `isInsideMediaDir` |
| Expired media slot integrity | PASS after MQ-005 | new profile-photos test |

## Weaknesses corrected this pass

- MQ-005 profile slot pointers after expiry cleanup.
- MQ-006 path prefix containment hardening.
- MQ-002 fake password-change success in account mode (security UX).

## Remaining risks (not exploited in this pass)

1. **Hosting**: Free Render ephemeral disk; production secrets must stay out of the repo.
2. **Live providers**: Enabling OpenAI/Gemini/FASHN without consent, budget, and retention review would expand the threat model.
3. **Email**: Capture loopback is not a production mailer; token delivery depends on future provider config.
4. **Demonstration UI**: Browser localStorage membership/settings remain; account mode is labelled but dual-state still exists for some preferences (MQ-007).
5. **CSRF on GET downloads**: Export download is GET + cookie; relies on SameSite and origin policy — acceptable for current model; revisit if cross-site embedding is allowed.
6. **No public vulnerability scan**: Intentionally out of scope.

## Conclusion

Local security controls for authentication, authorisation, media privacy, and credit accounting behaved as designed under automated attack-style tests. Remaining risks are primarily launch/ops and dual demo/account UI surfaces, not unfixed critical IDOR in the exercised APIs.
