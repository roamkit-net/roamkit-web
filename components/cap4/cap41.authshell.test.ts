import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Cap4.1 — AuthShell chrome binds --auth-* only; form trees untouched.
 */
const ROOT = process.cwd();

function read(rel: string): string {
  return readFileSync(join(ROOT, rel), "utf8");
}

/** Extract AuthShell function body from AuthForm.tsx */
function authShellSource(): string {
  const source = read("components/AuthForm.tsx");
  const start = source.indexOf("export function AuthShell");
  assert.ok(start >= 0, "AuthShell export");
  const next = source.indexOf("\ntype SharedFormProps", start);
  assert.ok(next > start, "AuthShell end marker");
  return source.slice(start, next);
}

describe("Cap4.1 AuthShell chrome", () => {
  it("AuthShell uses auth theme tokens (no slate/white/cyan shell chrome)", () => {
    const shell = authShellSource();
    assert.match(shell, /auth-page-bg/);
    assert.match(shell, /auth-shell-enter/);
    assert.match(shell, /auth-shell-panel/);
    assert.match(shell, /auth-shell-footer/);
    assert.match(shell, /text-\[var\(--auth-chrome-text\)\]/);
    assert.match(shell, /text-\[var\(--auth-chrome-text-muted\)\]/);
    assert.doesNotMatch(shell, /text-white|text-slate-|bg-white|border-white|text-cyan-/);
    assert.doesNotMatch(shell, /px-6|py-16|max-w-md/);
    // Forms stay out of AuthShell.
    assert.doesNotMatch(shell, /AuthSubmitButton|Field|PasswordField|Turnstile/);
  });

  it("globals declare Cap4.1 auth chrome + spacing SoT", () => {
    const css = read("app/globals.css");
    assert.match(css, /--auth-chrome-text:\s*var\(--color-text\)/);
    assert.match(css, /--auth-chrome-text-muted:\s*var\(--color-text-muted\)/);
    assert.match(css, /--auth-border:\s*rgba\(255,\s*255,\s*255,\s*0\.1\)/);
    assert.match(css, /--auth-gutter-x:\s*1\.5rem/);
    assert.match(css, /--auth-page-padding-y:\s*4rem/);
    assert.match(css, /--auth-content-max:\s*28rem/);
    assert.match(css, /\.auth-shell-panel\s*\{/);
    assert.match(css, /background-color:\s*var\(--auth-surface\)/);
    assert.match(css, /prefers-reduced-motion:\s*reduce/);
  });

  it("AuthShell hierarchy order: Logo → Title → Form panel → Footer", () => {
    const shell = authShellSource();
    const logo = shell.indexOf("<Logo");
    const title = shell.indexOf("<h1");
    const panel = shell.indexOf("auth-shell-panel");
    const footer = shell.indexOf("auth-shell-footer");
    assert.ok(logo < title && title < panel && panel < footer, "hierarchy order");
  });
});
