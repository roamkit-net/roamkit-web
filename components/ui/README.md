# Design System — primitive status

Colocated Cap2 changelog (ADR 016). Alert ≠ Toast.

| Primitive | Status | Canonical | Notes |
|-----------|--------|-----------|-------|
| Button | ✅ | `ui/Button` | Cap2.1 — variant / size / tone |
| Alert | ✅ | `ui/Alert` | Cap2.2 — info / success / warning / error |
| Input | ⏳ | `ui/Input` | Cap2.3 |
| Card | ⏳ | `ui/Card` | Cap2.4 |
| Skeleton | ⏳ | `ui/Skeleton` | Cap2.5 |
| Empty | ⏳ | `ui/EmptyState` | Cap2.5 |
| Badge | ⏳ | `ui/Badge` | Cap2.5 |

Migration policy: create → tests → migrate callers → delete duplicates. Zero intentional visual change per slice.
