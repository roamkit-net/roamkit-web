# Design System — primitive status

Colocated Cap2 changelog (ADR 016). Alert ≠ Toast.

| Primitive | Status | Canonical | Notes |
|-----------|--------|-----------|-------|
| Button | ✅ | `ui/Button` | Cap2.1 — [#97](https://github.com/roamkit-net/roamkit-web/pull/97) |
| Alert | ✅ | `ui/Alert` | Cap2.2 — [#98](https://github.com/roamkit-net/roamkit-web/pull/98) |
| Field | ✅ | `ui/Field` | Cap2.3 layout — Label / HelpText / ErrorMessage |
| Input | ✅ | `ui/Input` | Cap2.3 — [#99](https://github.com/roamkit-net/roamkit-web/pull/99); `state`, adornments |
| Textarea | ✅ | `ui/Textarea` | Cap2.3 — same chrome as Input |
| Card | ⏳ | `ui/Card` | Cap2.4 |
| Skeleton | ⏳ | `ui/Skeleton` | Cap2.5 |
| Empty | ⏳ | `ui/EmptyState` | Cap2.5 |
| Badge | ⏳ | `ui/Badge` | Cap2.5 |

### Cap2.3 ownership

```text
ui/Input — control primitive
Public: state, tone, startAdornment, endAdornment, native input attrs (disabled, readOnly, …)
Forbidden: inline colors/spacing/shadows; label/help/error layout; domain logic

ui/Field — layout primitive
Public: state, tone, id; children Label | Input | Textarea | HelpText | ErrorMessage
Forbidden: business validation; domain copy

ui/Textarea — control primitive (same state/tone as Input)
```

### Cap2.3 acceptance

- [x] API review (Field + state + adornments)
- [x] a11y (label, describedby, aria-invalid)
- [x] Keyboard navigation verified (default focusable; no tabindex=-1)
- [x] Theme tone auth | app
- [x] Migration: AuthForm email via Field; PasswordField composes Input endAdornment
- [x] No Masked / Phone / OTP / Search in Cap2.3

Migration policy: create → tests → migrate callers → delete duplicates. Zero intentional visual change per slice.
