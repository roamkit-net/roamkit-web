import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Cap4.3 — close Cap4 without inventing design.
 * Locks AuthShell + tone="auth" + Landing/App isolation.
 */

const ROOT = process.cwd();

const AUTH_ROUTES: { label: string; path: string }[] = [
  { label: "/login", path: "app/login/page.tsx" },
  { label: "/register", path: "app/register/page.tsx" },
  { label: "/forgot-password", path: "app/forgot-password/page.tsx" },
  { label: "/reset-password", path: "app/reset-password/page.tsx" },
  { label: "/set-password", path: "app/set-password/page.tsx" },
];

function read(rel: string): string {
  return readFileSync(join(ROOT, rel), "utf8");
}

describe("Cap4.3 Auth Polish validation", () => {
  it("all auth routes use AuthShell (not AppShell)", () => {
    for (const route of AUTH_ROUTES) {
      const source = read(route.path);
      assert.match(source, /AuthShell/, `${route.label}: AuthShell`);
      assert.doesNotMatch(source, /AppShell/, `${route.label}: no AppShell`);
    }
  });

  it("AuthForm primary path keeps tone=auth + remember-me tokens", () => {
    const form = read("components/AuthForm.tsx");
    assert.match(form, /tone="auth"/);
    assert.match(form, /id="remember_me"/);
    assert.match(form, /text-\[var\(--auth-primary\)\]/);
    assert.match(form, /ring-\[var\(--auth-focus-ring\)\]/);
    assert.match(form, /text-\[var\(--auth-text\)\]/);
  });

  it("Button/Input auth tone binds --auth-* (focus + primary)", () => {
    const button = read("components/ui/Button.tsx");
    assert.match(
      button,
      /primary: `bg-\[var\(--auth-primary\)\].*hover:bg-\[var\(--auth-primary-hover\)\].*focus-visible:ring-\[var\(--auth-focus-ring\)\]/,
    );
    assert.match(
      button,
      /focus-visible:ring-offset-\[var\(--auth-background\)\]/,
    );
    const input = read("components/ui/Input.tsx");
    assert.match(
      input,
      /auth:\s*"border-slate-300 ring-\[var\(--auth-focus-ring\)\] focus:border-\[var\(--auth-primary\)\]/,
    );
  });

  it("Landing / stays on landing theme (no AuthShell / AppShell)", () => {
    const home = read("app/page.tsx");
    assert.match(home, /--landing-ink/);
    assert.doesNotMatch(home, /AuthShell|AppShell|--auth-primary|--app-primary/);
    const authNav = read("components/AuthNav.tsx");
    assert.match(authNav, /landing-cta/);
  });

  it("AppShell sample /plans stays on app theme", () => {
    const plans = read("components/PlansStore.tsx");
    assert.match(plans, /AppShell/);
    assert.match(plans, /text-\[var\(--app-chrome-text\)\]/);
    assert.doesNotMatch(plans, /AuthShell|auth-page-bg/);
  });

  it("Cap2 Button/Input public API freeze held", () => {
    const button = read("components/ui/Button.tsx");
    assert.match(
      button,
      /export type ButtonVariant = "primary" \| "secondary" \| "ghost" \| "danger"/,
    );
    assert.match(button, /export type ButtonTone = "app" \| "auth"/);
    assert.doesNotMatch(button, /variant\?:.*"outline"/);
    const input = read("components/ui/Input.tsx");
    assert.match(input, /export type InputTone = "app" \| "auth"/);
  });

  it("auth reduced-motion escape for .auth-shell-enter remains", () => {
    const css = read("app/globals.css");
    assert.match(css, /\.auth-shell-enter\s*\{/);
    assert.match(
      css,
      /@media \(prefers-reduced-motion:\s*reduce\)\s*\{[\s\S]*?\.auth-shell-enter/,
    );
  });

  it("auth panel surface keeps elevated contrast for form text", () => {
    const css = read("app/globals.css");
    assert.match(css, /--auth-surface:\s*rgba\(255,\s*255,\s*255,\s*0\.95\)/);
    assert.match(css, /--auth-text:\s*#0f172a/);
    assert.match(css, /--auth-primary:\s*var\(--color-primary\)/);
    assert.match(css, /--auth-focus-ring:\s*var\(--focus-ring\)/);
  });
});
