import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Cap4.2 — form theme binding via existing Cap2 tone="auth" (no API expansion).
 */
const ROOT = process.cwd();

function read(rel: string): string {
  return readFileSync(join(ROOT, rel), "utf8");
}

describe("Cap4.2 auth form theme binding", () => {
  it("Button public API unchanged (no new props/variants)", () => {
    const button = read("components/ui/Button.tsx");
    assert.match(
      button,
      /export type ButtonVariant = "primary" \| "secondary" \| "ghost" \| "danger"/,
    );
    assert.match(button, /export type ButtonTone = "app" \| "auth"/);
    assert.doesNotMatch(button, /variant\?:.*"outline"/);
  });

  it("Button auth primary uses --auth-* only", () => {
    const button = read("components/ui/Button.tsx");
    assert.match(button, /bg-\[var\(--auth-primary\)\]/);
    assert.match(button, /ring-offset-\[var\(--auth-background\)\]/);
    assert.doesNotMatch(
      button,
      /auth:\s*\{[\s\S]*?primary:[^`]*bg-cyan-500/,
    );
  });

  it("Input auth focus uses --auth-focus-ring / --auth-primary", () => {
    const input = read("components/ui/Input.tsx");
    assert.match(
      input,
      /auth:\s*"border-slate-300 ring-\[var\(--auth-focus-ring\)\] focus:border-\[var\(--auth-primary\)\]/,
    );
    assert.doesNotMatch(input, /auth:\s*"[^"]*ring-cyan-500/);
  });

  it("AuthForm remember-me uses auth tokens (no cyan-600)", () => {
    const form = read("components/AuthForm.tsx");
    assert.match(form, /text-\[var\(--auth-primary\)\]/);
    assert.match(form, /ring-\[var\(--auth-focus-ring\)\]/);
    assert.doesNotMatch(form, /text-cyan-600|ring-cyan-500/);
  });
});
