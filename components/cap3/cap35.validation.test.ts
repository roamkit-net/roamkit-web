import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * Cap3.5 — close Cap3 without inventing design.
 * Locks theme/CTA boundaries that visual audit must keep green.
 */

const ROOT = process.cwd();

const SKY700_ALLOWLIST = new Set([
  /** Setup stepper active pill — Visual Debt, not primary CTA. */
  "app/me/esims/[id]/setup/page.tsx",
  /** PlansStore tab indicator — not a primary action. */
  "components/PlansStore.tsx",
  /** Avatar chrome — Cap2b Reuse, not CTA. */
  "components/UserMenu.tsx",
]);

const APPSHELL_ROUTES: { label: string; path: string }[] = [
  { label: "/plans", path: "components/PlansStore.tsx" },
  { label: "/[slug]-esim", path: "components/LocationDetail.tsx" },
  { label: "/me/esims", path: "app/me/esims/page.tsx" },
  { label: "/me/esims/[id]", path: "app/me/esims/[id]/page.tsx" },
  { label: "/me/esims/[id]/setup", path: "app/me/esims/[id]/setup/page.tsx" },
  { label: "/me/deposit", path: "app/me/deposit/page.tsx" },
];

const PRIMARY_CTA_FILES = [
  "components/ui/Button.tsx",
  "components/AuthNav.tsx",
  "components/billing/DepositCta.tsx",
  "components/deposit/WalletDepositPanel.tsx",
  "components/deposit/CexDepositForm.tsx",
  "components/deposit/DepositPendingBanner.tsx",
  "components/deposit/VoucherRedeemForm.tsx",
  "app/me/esims/[id]/page.tsx",
  "app/me/esims/[id]/setup/page.tsx",
];

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

function read(rel: string): string {
  return readFileSync(join(ROOT, rel), "utf8");
}

describe("Cap3.5 theme + CTA boundaries", () => {
  it("app Button primary binds only --app-* tokens (no sky-700)", () => {
    const button = read("components/ui/Button.tsx");
    assert.match(
      button,
      /primary: `bg-\[var\(--app-primary\)\].*hover:bg-\[var\(--app-primary-hover\)\].*focus-visible:ring-\[var\(--app-focus-ring\)\]/,
    );
    assert.doesNotMatch(
      button,
      /app:\s*\{[^}]*primary:[^`]*bg-sky-700/,
    );
  });

  it("auth Button primary stays cyan (AuthShell tone)", () => {
    const button = read("components/ui/Button.tsx");
    assert.match(button, /auth:\s*\{[\s\S]*?primary:\s*"bg-cyan-500/);
    const authForm = read("components/AuthForm.tsx");
    assert.match(authForm, /tone="auth"/);
    assert.match(authForm, /auth-page-bg/);
  });

  it("landing Sign-in and marketing CTAs stay on landing theme", () => {
    const authNav = read("components/AuthNav.tsx");
    assert.match(authNav, /landing-cta/);
    assert.match(
      authNav,
      /variant === "landing"[\s\S]*LANDING_SIGN_IN[\s\S]*buttonClassName/,
    );
    const hero = read("components/landing/HeroSection.tsx");
    assert.match(hero, /landing-cta/);
    assert.doesNotMatch(hero, /--app-primary/);
    const home = read("app/page.tsx");
    assert.match(home, /--landing-ink/);
    assert.doesNotMatch(home, /AppShell/);
  });

  it("--app-primary is defined only under App theme aliases in globals", () => {
    const css = read("app/globals.css");
    assert.match(css, /--app-primary:\s*var\(--color-primary\)/);
    assert.match(css, /--landing-cta:\s*var\(--color-primary\)/);
    assert.match(css, /--auth-primary:\s*var\(--color-primary\)/);
    // Primary CTA class binding is app-scoped, not a global utility dump.
    assert.doesNotMatch(css, /\.app-primary\s*\{/);
  });

  it("AppShell routes keep dark-shell chrome text tokens", () => {
    for (const route of APPSHELL_ROUTES) {
      const source = read(route.path);
      assert.match(
        source,
        /text-\[var\(--app-chrome-text\)\]/,
        `${route.label}: chrome text`,
      );
      assert.match(
        source,
        /text-\[var\(--app-chrome-text-muted\)\]/,
        `${route.label}: chrome muted`,
      );
      assert.match(source, /AppShell/, `${route.label}: AppShell`);
    }
  });

  it("primary CTA call sites do not hardcode bg-sky-700", () => {
    for (const rel of PRIMARY_CTA_FILES) {
      const source = read(rel);
      if (rel.endsWith("setup/page.tsx")) {
        // Stepper active state may keep sky; action CTAs must use buttonClassName.
        assert.match(source, /buttonClassName\(\{/);
        const withoutStepper = source.replace(
          /\? "bg-sky-700 text-white"/g,
          "",
        );
        assert.doesNotMatch(withoutStepper, /bg-sky-700/);
        continue;
      }
      assert.doesNotMatch(
        source,
        /bg-sky-700/,
        `${rel}: no sky-700 primary CTA`,
      );
    }
  });

  it("remaining bg-sky-700 are only allowlisted Visual Debt", () => {
    const hits: string[] = [];
    for (const rel of walkTsx(ROOT)) {
      if (rel.startsWith("node_modules/") || rel.includes(".next/")) continue;
      if (/\.test\.(ts|tsx)$/.test(rel)) continue;
      const source = read(rel);
      if (!source.includes("bg-sky-700")) continue;
      if (SKY700_ALLOWLIST.has(rel)) continue;
      hits.push(rel);
    }
    assert.deepEqual(
      hits,
      [],
      `unexpected bg-sky-700 outside Cap3 debt allowlist: ${hits.join(", ")}`,
    );
  });

  it("Cap2 Button public API surface unchanged (variant/size/tone only)", () => {
    const button = read("components/ui/Button.tsx");
    assert.match(
      button,
      /export type ButtonVariant = "primary" \| "secondary" \| "ghost" \| "danger"/,
    );
    assert.match(button, /export type ButtonSize = "sm" \| "md" \| "lg"/);
    assert.match(button, /export type ButtonTone = "app" \| "auth"/);
    assert.doesNotMatch(button, /variant\?:.*"outline"/);
    assert.doesNotMatch(button, /size\?:.*"xl"/);
  });

  it("prefers-reduced-motion escapes remain for shell + landing + skeleton", () => {
    const css = read("app/globals.css");
    const blocks = css.match(/@media \(prefers-reduced-motion: reduce\)/g) ?? [];
    assert.ok(blocks.length >= 3, `expected ≥3 reduced-motion blocks, got ${blocks.length}`);
    const skeleton = read("components/ui/Skeleton.tsx");
    assert.match(skeleton, /motion-reduce:animate-none/);
  });

  it("app primary focus ring uses brand token + AppShell ring-offset", () => {
    const button = read("components/ui/Button.tsx");
    assert.match(button, /focus-visible:ring-\[var\(--app-focus-ring\)\]/);
    assert.match(
      button,
      /focus-visible:ring-offset-\[var\(--app-background\)\]/,
    );
  });
});
