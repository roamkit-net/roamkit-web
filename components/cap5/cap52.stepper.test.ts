import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Cap5.2 — setup stepper pills theme-only (no ui/Stepper; single call site).
 */

const ROOT = process.cwd();

function read(rel: string): string {
  return readFileSync(join(ROOT, rel), "utf8");
}

/** Extract the STEPS.map pill className ternary from setup page. */
function stepperPillClasses(): string {
  const source = read("app/me/esims/[id]/setup/page.tsx");
  const start = source.indexOf("{STEPS.map(");
  assert.ok(start >= 0, "STEPS.map");
  const end = source.indexOf("</ol>", start);
  assert.ok(end > start, "stepper ol end");
  return source.slice(start, end);
}

describe("Cap5.2 stepper theme binding", () => {
  it("inventory: Cap5 stepper pills exist only on setup page", () => {
    const setup = read("app/me/esims/[id]/setup/page.tsx");
    assert.match(setup, /STEPS\.map/);
    assert.match(setup, /bg-\[var\(--app-primary\)\]/);
    // Landing How-it-works STEPS is a different surface (landing tokens) — out of Cap5.
    const landing = read("components/landing/LandingSections.tsx");
    assert.match(landing, /landing-accent/);
    assert.doesNotMatch(landing, /bg-sky-700|bg-\[var\(--app-primary\)\]/);
    // No shared ui/Stepper primitive.
    assert.throws(() => read("components/ui/Stepper.tsx"), /ENOENT/);
  });

  it("three visual states bind --app-* only (theme-only)", () => {
    const pills = stepperPillClasses();
    assert.match(pills, /bg-\[var\(--app-primary\)\] text-\[var\(--app-primary-foreground\)\]/);
    assert.match(
      pills,
      /bg-\[var\(--app-surface-elevated\)\] text-\[var\(--app-text\)\]/,
    );
    assert.match(
      pills,
      /bg-\[var\(--app-border\)\] text-\[var\(--app-text-muted\)\]/,
    );
    assert.doesNotMatch(pills, /bg-sky-700|bg-sky-100|bg-slate-200/);
    // Spacing / structure unchanged.
    assert.match(pills, /rounded-full px-3 py-1 text-xs font-medium/);
  });

  it("setup page still has no Cap5 scope creep (links out of slice)", () => {
    const source = read("app/me/esims/[id]/setup/page.tsx");
    assert.doesNotMatch(source, /bg-sky-700/);
    // Cap6 / link chrome may keep text-sky-700 — not Cap5.2.
    assert.match(source, /text-sky-700/);
  });
});
