import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * Cap5.4 — close Cap5 without inventing design.
 * Chrome consistency matrix + Cap5 legacy chrome audit.
 */

const ROOT = process.cwd();

function read(rel: string): string {
  return readFileSync(join(ROOT, rel), "utf8");
}

function walkTsx(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === ".next") continue;
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) walkTsx(full, out);
    else if (/\.(tsx|ts)$/.test(name)) {
      out.push(full.slice(ROOT.length + 1));
    }
  }
  return out;
}

describe("Cap5.4 Design Consistency validation", () => {
  it("Chrome consistency matrix: Cap2 primitives stay token-bound", () => {
    const button = read("components/ui/Button.tsx");
    assert.match(button, /bg-\[var\(--app-primary\)\]/);
    assert.match(button, /bg-\[var\(--auth-primary\)\]/);
    assert.match(button, /focus-visible:ring-\[var\(--app-focus-ring\)\]/);
    const input = read("components/ui/Input.tsx");
    assert.match(input, /ring-\[var\(--app-focus-ring\)\]|ring-\[var\(--auth-focus-ring\)\]/);
    const alert = read("components/ui/Alert.tsx");
    assert.match(alert, /export function Alert|variant/);
    const card = read("components/ui/Card.tsx");
    assert.match(card, /export function Card/);
  });

  it("Chrome consistency matrix: Tabs / Stepper / Avatar on --app-*", () => {
    const plans = read("components/PlansStore.tsx");
    assert.match(plans, /bg-\[var\(--app-primary\)\]/);
    assert.doesNotMatch(plans, /bg-sky-700/);

    const detail = read("components/LocationDetail.tsx");
    const serviceTab = detail.slice(
      detail.indexOf("function ServiceTab"),
      detail.indexOf("\nfunction SegmentButton"),
    );
    assert.match(serviceTab, /border-\[var\(--app-primary\)\]/);

    const setup = read("app/me/esims/[id]/setup/page.tsx");
    const pills = setup.slice(
      setup.indexOf("{STEPS.map("),
      setup.indexOf("</ol>"),
    );
    assert.match(pills, /bg-\[var\(--app-primary\)\]/);
    assert.match(pills, /bg-\[var\(--app-surface-elevated\)\]/);
    assert.match(pills, /bg-\[var\(--app-border\)\]/);
    assert.doesNotMatch(pills, /bg-sky-700|bg-sky-100/);

    const menu = read("components/UserMenu.tsx");
    const btn = menu.slice(menu.indexOf("<button"), menu.indexOf("</button>"));
    assert.match(btn, /bg-\[var\(--app-primary\)\]/);
    assert.match(btn, /ring-\[var\(--app-focus-ring\)\]/);
    assert.doesNotMatch(btn, /bg-sky-700|ring-sky-500/);
  });

  it("Legacy Chrome Audit: Cap3.5 SKY700_ALLOWLIST empty", () => {
    const source = read("components/cap3/cap35.validation.test.ts");
    const match = source.match(
      /const SKY700_ALLOWLIST = new Set(?:<string>)?\(\[([\s\S]*?)\]\);/,
    );
    assert.ok(match, "SKY700_ALLOWLIST");
    const body = match[1].replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*/g, "");
    assert.doesNotMatch(body, /PlansStore|setup\/page|UserMenu/);
    assert.doesNotMatch(body, /"[^"]+\.(tsx|ts)"/);
  });

  it("Legacy Chrome Audit: Cap5 surfaces have no bg-sky-700", () => {
    for (const rel of [
      "components/PlansStore.tsx",
      "components/LocationDetail.tsx",
      "app/me/esims/[id]/setup/page.tsx",
      "components/UserMenu.tsx",
    ]) {
      assert.doesNotMatch(
        read(rel),
        /bg-sky-700/,
        `${rel}: no Cap5-scoped bg-sky-700`,
      );
    }
  });

  it("no unexpected bg-sky-700 outside Cap6 link/eyebrow debt", () => {
    // Cap5 cleared the CTA/pill allowlist. Remaining bg-sky-700 must be none.
    const hits: string[] = [];
    for (const rel of walkTsx(ROOT)) {
      if (rel.startsWith("node_modules/") || rel.includes(".next/")) continue;
      if (/\.test\.(ts|tsx)$/.test(rel)) continue;
      if (read(rel).includes("bg-sky-700")) hits.push(rel);
    }
    assert.deepEqual(
      hits,
      [],
      `unexpected bg-sky-700 after Cap5: ${hits.join(", ")}`,
    );
  });

  it("Landing and Auth isolation held", () => {
    const home = read("app/page.tsx");
    assert.match(home, /--landing-ink/);
    assert.doesNotMatch(home, /AppShell|AuthShell/);
    const login = read("app/login/page.tsx");
    assert.match(login, /AuthShell/);
    assert.doesNotMatch(login, /AppShell/);
    const landing = read("components/landing/LandingSections.tsx");
    assert.match(landing, /landing-accent/);
    assert.doesNotMatch(landing, /bg-\[var\(--app-primary\)\]/);
  });

  it("Cap2 API Freeze held (no new Tabs/Stepper/Avatar primitives)", () => {
    const button = read("components/ui/Button.tsx");
    assert.match(button, /export type ButtonTone = "app" \| "auth"/);
    assert.throws(() => read("components/ui/Tabs.tsx"), /ENOENT/);
    assert.throws(() => read("components/ui/Stepper.tsx"), /ENOENT/);
    assert.throws(() => read("components/ui/Avatar.tsx"), /ENOENT/);
  });

  it("focus rings + reduced-motion escapes remain", () => {
    const css = read("app/globals.css");
    assert.match(css, /--app-focus-ring:/);
    assert.match(css, /--auth-focus-ring:/);
    const blocks = css.match(/@media \(prefers-reduced-motion: reduce\)/g) ?? [];
    assert.ok(blocks.length >= 3, `expected ≥3 reduced-motion blocks`);
  });
});
