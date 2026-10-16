# Onboarding data mapping

Date: 16 October 2026. The onboarding screens are unchanged apart from an empty height field when the account has no height, and removal of the automatic name "Nandi" when the name box is empty.

| Onboarding field | API field | Notes |
| --- | --- | --- |
| Preferred first name | `displayName` | Required by the existing form |
| Age range | `age_range` | Added in migration `002_profile_details.sql` |
| Height | `profile_measurements.height_cm` | Optional. Empty stays empty |
| Country | `country` | |
| Currency | `currency` | Values such as `ZAR (R)` fit the 16-character limit |
| Tops, bottoms, dress, shoe | `sizes.tops`, `bottoms`, `dress`, `shoe` | Existing labels such as `SA 34 / UK 10` fit the 32-character limit |
| Bust, waist, hip | `bust_cm`, `waist_cm`, `hip_cm` | Optional whole centimetres. Not inferred from photographs |
| Style aesthetics | `styles` and `interests` | The screen has one style list. It is stored in both fields so the choice is not dropped |
| Favourite and avoid colours | `favouriteColours`, `avoidColours` | |
| Fit and experimentation | `fitPreference`, `experimentation` | Same enums as the screen |
| Item budget | `budgetTier` | Same ids as the screen |
| Shopping priorities | `shopping_priorities_json` | Added in migration 002 |
| Favourite retailers | `favourite_retailers_json` | Added in migration 002 |
| Finished setup | `onboarding_status=completed` | `pending` opens setup. Skip sets `deferred` |
| Photographs | Not stored | Kept in browser memory for the session only |

`completion_status` is still `complete` only when a display name, at least one style, a tops size, and a budget are present. That is separate from `onboarding_status`.

AI personalisation consent and marketing opt-in stay false. The onboarding screens do not ask those questions. The membership privacy screen is still a browser demonstration and is not written to `user_preferences`.
