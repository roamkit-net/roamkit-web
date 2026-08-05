# Cap2 Review — quality gate

**Not a capability.** This is the gate that officially closes Cap2 before Cap3 (AppShell Variant A).

Date: 2026-08-05  
Repo: `roamkit-web` (`develop` @ Cap2.5 #101)  
ADR: [016 — web design tokens](https://github.com/roamkit-net/roamkit-docs/blob/develop/docs/adr/016-web-design-tokens.md)

## Verdict

| Gate | Result |
|------|--------|
| Primitives present (Cap2.1–2.5) | **PASS** |
| Composition (no reverse / no domain in `ui/*`) | **PASS** |
| Theme: no brand-token direct in `ui/*` | **PASS** |
| Bundle: no Cap2-only npm deps | **PASS** |
| Documentation sync (this review + README) | **PASS** (docs PR paired) |
| Adoption complete (zero legacy) | **PASS WITH BACKLOG** — see matrix; leftovers are documented Reuse / out-of-scope / deferred migrations, not Cap2 reopen |

**Cap2 is officially CLOSED as a capability.**  
Known leftovers become **migration backlog** or future small PRs — not Cap2.6 and not Cap3 scope.

---

## Cap2 API Freeze

Effective immediately:

1. **New props** on Cap2 primitives only with explicit justification (a11y, regression, or Cap2 Review follow-up).
2. **Breaking API changes** only via a new named capability / ADR discussion — never drive-by in Cap3.
3. **Business / domain props forbidden** (`type="wallet"`, `status="paid"`, deposit/eSIM enums, etc.).
4. **Cap3 must not change the public API of any Cap2 primitive.** If AppShell work discovers a gap, open a small dedicated PR — do not grow Button/Card inside Cap3.

---

## 1. Primitive Adoption Matrix

Import files = app + components excluding `components/ui/` itself.

| Primitive | Legacy leftovers | New usages | Status |
|-----------|-----------------:|----------:|--------|
| Button | eSIM setup/detail + AuthNav CTAs; deposit domain still ad-hoc (Cap2.1 logged gap) | 5 files | Partial — backlog |
| Alert | Domain banners still custom (OK; Alert ≠ Toast) | 8 files | Partial — acceptable |
| Field | Most forms not yet Field-wrapped | 2 files | Partial — backlog |
| Input | 6 raw text fields (deposit/modals/search) | 2 files | Partial — backlog |
| Textarea | EsimNoteForm still raw | 0 imports | Partial — backlog |
| Card | LocationSearch dropdown only (not panel) | 12 files | Near-complete |
| CardSection | — | with Card | Complete |
| CardHeader / CardFooter | 0 app uses | tests only | Shipped reserved — keep |
| ListRow | PlanCard custom dense card | 3 files | Partial — Reuse OK |
| Skeleton | CatalogPriceDisplay pulse | via List/Deposit skeletons | Partial — backlog |
| Empty | Modal / inline empties | 4 files | Partial — backlog |
| Badge | Setup stepper pills (Replace → Stepper later) | 2 files | Partial — OK |

**Interpretation:** Cap2 goal was architecture + Merge of inventory priorities with zero visual. Full zero-legacy adoption was never the Cap2 stop rule. Remaining items are tracked backlog, not reopen Cap2.

---

## 2. Theme Coverage

| Primitive | Brand token direct in `ui/*` | Notes |
|-----------|------------------------------|-------|
| Button … Badge (all) | **0** | Pass |
| Product TSX | Uses Tailwind slate/sky literals | Expected per ADR 016 until Cap3 wires `--app-*` |

Components must not reference brand tokens directly (ADR 016). Cap2 primitives comply. Wiring pages to `--app-*` aliases is Cap3+ territory.

---

## 3. Composition Audit

Rule: `Button → Field → Card → Page` (never inverted).

| Check | Result |
|-------|--------|
| Button imports Card / Page | No |
| Card imports Page / Button | No |
| Input / Field import Deposit / eSIM / billing | No |
| Domain wrappers compose primitives (`PasswordField`, `DepositCta`, `PackageRow`) | Yes |

**PASS.** Soft note: `Field` type-imports `ControlState` / `InputTone` from `Input` — acceptable shared control types, not a reverse Page dependency.

---

## 4. Public API Audit

Exports follow Cap2 pattern: component + `*ClassName` + types.

| Finding | Decision |
|---------|----------|
| `CardHeader` / `CardFooter` unused in app | **Keep** — locked Cap2.4 API for future sections |
| `Textarea` unused | **Keep** — Cap2.3 API; migrate EsimNoteForm in backlog |
| `HelpText` / `ErrorMessage` unused outside tests | **Keep** — Field layout API |
| Unused Badge variants / Button ghost/danger | **Keep** — visual variant matrix |
| `Empty` `icon` unused | **Keep** — locked Cap2.5 API |
| `ListSkeleton` / `DetailSkeleton` | Composition helpers (not new Cap2 primitives) — OK |

No public API removals in this gate (freeze > shrink).

---

## 5. Bundle Check

| Check | Result |
|-------|--------|
| Cap2-only npm deps (`cva`, `clsx` direct, Radix) | None |
| Parallel `cn()` util outside `ui/` | None |
| Two competing Button systems in `ui/` | None |

Class join helpers are duplicated per file (small, intentional — no new dependency for Cap2).

**PASS.**

---

## 6. Documentation Sync

| Doc | Action |
|-----|--------|
| `roamkit-web/components/ui/README.md` | Coverage table + API Freeze |
| `roamkit-web/components/ui/CAP2_REVIEW.md` | This gate |
| `roamkit-docs/docs/design/status.md` | Mark Cap2.4–2.5 ✅; Cap2 CLOSED |
| `roamkit-docs/docs/design/component-inventory.md` | Pointer to Cap2 closed + freeze |
| ADR 016 | Unchanged (Accepted) — Cap2 complete per ADR sequence |

---

## Cap3 entry rule

> Cap3 (AppShell Variant A) must not change Cap2 primitive APIs.  
> Gaps → small dedicated PR / capability. Bugs → fix-forward without expanding API.

---

## Migration backlog (post-Cap2, pre- or parallel to Cap3)

Not blocking Cap3:

1. eSIM setup/detail + AuthNav → `Button` / `buttonClassName`
2. Deposit / voucher / modal text fields → `Input` (+ `Field` where labels exist)
3. `EsimNoteForm` → `Textarea`
4. `CatalogPriceDisplay` pulse → `Skeleton`
5. Optional: modal empties → `Empty`

Do **not** fold this backlog into Cap3 AppShell work.
