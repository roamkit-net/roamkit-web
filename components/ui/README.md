# Design System — primitive status

Colocated Cap2 changelog (ADR 016). Alert ≠ Toast.

| Primitive | Status | Canonical | Notes |
|-----------|--------|-----------|-------|
| Button | ✅ | `ui/Button` | Cap2.1 — [#97](https://github.com/roamkit-net/roamkit-web/pull/97) |
| Alert | ✅ | `ui/Alert` | Cap2.2 — [#98](https://github.com/roamkit-net/roamkit-web/pull/98) |
| Field | ✅ | `ui/Field` | Cap2.3 layout — Label / HelpText / ErrorMessage |
| Input | ✅ | `ui/Input` | Cap2.3 — [#99](https://github.com/roamkit-net/roamkit-web/pull/99); `state`, adornments |
| Textarea | ✅ | `ui/Textarea` | Cap2.3 — same chrome as Input |
| Card | ✅ | `ui/Card` | Cap2.4 — Header / Section / Footer |
| ListRow | ✅ | `ui/ListRow` | Cap2.4 — leading / content / trailing |
| Skeleton | ⏳ | `ui/Skeleton` | Cap2.5 |
| Empty | ⏳ | `ui/EmptyState` | Cap2.5 |
| Badge | ⏳ | `ui/Badge` | Cap2.5 |

### Composition Rules

```text
Button → Field → Card → Page
```

Never invert. Primitives never contain domain logic (Orders / eSIM / Wallet / Billing).

### Cap2.4 ownership

```text
ui/Card — container only
Public: as, className, children
Forbidden: elevation, shadowLevel, rounded, interactive, columns, domain props

ui/CardHeader | CardSection | CardFooter — spacing slots
Public (Section): divider, padding (md|lg|none)
Forbidden: standalone <hr>; ad-hoc p-6 border-b outside these slots

ui/ListRow — row composition
Public: leading, children, trailing, interactive, as
Use listRowClassName on Link/button wrappers
```

Migration policy: create → tests → migrate callers → delete duplicates. Zero intentional visual change per slice.
