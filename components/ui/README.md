# Design System — primitive status

Colocated Cap2 changelog (ADR 016). Alert ≠ Toast.

| Primitive | Status | Canonical | Notes |
|-----------|--------|-----------|-------|
| Button | ✅ | `ui/Button` | Cap2.1 — [#97](https://github.com/roamkit-net/roamkit-web/pull/97) |
| Alert | ✅ | `ui/Alert` | Cap2.2 — [#98](https://github.com/roamkit-net/roamkit-web/pull/98) |
| Input | ✅ | `ui/Input` | Cap2.3 — text/email/password chrome; PasswordField wraps control classes |
| Card | ⏳ | `ui/Card` | Cap2.4 |
| Skeleton | ⏳ | `ui/Skeleton` | Cap2.5 |
| Empty | ⏳ | `ui/EmptyState` | Cap2.5 |
| Badge | ⏳ | `ui/Badge` | Cap2.5 |

Migration policy: create → tests → migrate callers → delete duplicates. Zero intentional visual change per slice.
