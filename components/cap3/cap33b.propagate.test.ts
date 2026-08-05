import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Cap3.3b — remaining AppShell routes match Golden Route header chrome.
 * Elevated Card body text (slate-*) stays on light panels — not asserted here.
 */
const ROUTES: { label: string; path: string }[] = [
  { label: "/plans", path: "components/PlansStore.tsx" },
  { label: "/[slug]-esim", path: "components/LocationDetail.tsx" },
  { label: "/me/esims/[id]", path: "app/me/esims/[id]/page.tsx" },
  { label: "/me/esims/[id]/setup", path: "app/me/esims/[id]/setup/page.tsx" },
  { label: "/me/deposit", path: "app/me/deposit/page.tsx" },
];

describe("Cap3.3b AppShell surface propagate", () => {
  for (const route of ROUTES) {
    it(`${route.label} uses chrome text tokens on page header`, () => {
      const source = readFileSync(join(process.cwd(), route.path), "utf8");
      assert.match(
        source,
        /text-\[var\(--app-chrome-text-muted\)\]/,
        `${route.label}: muted chrome`,
      );
      assert.match(
        source,
        /text-\[var\(--app-chrome-text\)\]/,
        `${route.label}: primary chrome`,
      );
      // Page headers must not keep sky-700 eyebrow on dark shell.
      assert.doesNotMatch(
        source,
        /tracking-\[0\.2em\] text-sky-700/,
        `${route.label}: no sky-700 eyebrow`,
      );
    });
  }

  it("CoveragesSummary (LocationDetail header) uses chrome text on shell", () => {
    const source = readFileSync(
      join(process.cwd(), "components/CoveragesModal.tsx"),
      "utf8",
    );
    assert.match(source, /export function CoveragesSummary/);
    assert.match(
      source,
      /text-\[var\(--app-chrome-text-muted\)\]/,
    );
  });
});
