# Design System — primitive status

Colocated Cap2 changelog (ADR 016). Alert ≠ Toast.

## Cap2 coverage

| Primitive   | Status | Canonical     | Notes                                                                |
| ----------- | ------ | ------------- | -------------------------------------------------------------------- |
| Button      | ✅     | `ui/Button`   | Cap2.1 — [#97](https://github.com/roamkit-net/roamkit-web/pull/97)   |
| Alert       | ✅     | `ui/Alert`    | Cap2.2 — [#98](https://github.com/roamkit-net/roamkit-web/pull/98)   |
| Field       | ✅     | `ui/Field`    | Cap2.3 — Label / HelpText / ErrorMessage                             |
| Input       | ✅     | `ui/Input`    | Cap2.3 — [#99](https://github.com/roamkit-net/roamkit-web/pull/99)   |
| Textarea    | ✅     | `ui/Textarea` | Cap2.3                                                               |
| Card        | ✅     | `ui/Card`     | Cap2.4 — [#100](https://github.com/roamkit-net/roamkit-web/pull/100) |
| CardHeader  | ✅     | `ui/Card`     | Cap2.4                                                               |
| CardSection | ✅     | `ui/Card`     | Cap2.4 — `divider`, `padding`                                        |
| CardFooter  | ✅     | `ui/Card`     | Cap2.4                                                               |
| ListRow     | ✅     | `ui/ListRow`  | Cap2.4                                                               |
| Skeleton    | ✅     | `ui/Skeleton` | Cap2.5 — one primitive; compose sizes                                |
| Empty       | ✅     | `ui/Empty`    | Cap2.5 — no domain `type`                                            |
| Badge       | ✅     | `ui/Badge`    | Cap2.5 — visual variants only                                        |

**Cap2 primitives closed after Cap2.5.** Next: Cap2 Review (consistency), then Cap3 AppShell.

### Composition Rules

```text
Button → Field → Card → Page
```

Never invert. No domain logic in `ui/*`.

### Cap2.5 ownership

```text
ui/Skeleton
Public: variant (line|circle|rectangle), className (dimensions)
Forbidden: shimmer knobs; domain skeleton components as primitives
Motion: animate-pulse + motion-reduce:animate-none
CLS: callers set stable h/w matching final content

ui/Empty
Public: icon, title, description, action, alignment, compact
Forbidden: type=wallet|orders|…

ui/Badge
Public: variant (default|primary|success|warning|danger|neutral)
Forbidden: status=paid, walletStatus, domain enums
```

### Out of Cap2

Spinner, Progress, Avatar, Chip, Pill, Tooltip, DataTable, Modal, Toast, Dropdown, Command palette — only when needed.

Migration policy: create → tests → migrate callers → delete duplicates. Zero intentional visual change per slice.
