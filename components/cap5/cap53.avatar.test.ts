import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Cap5.3 — UserMenu avatar trigger chrome only (no dropdown redesign).
 */

const ROOT = process.cwd();

function read(rel: string): string {
  return readFileSync(join(ROOT, rel), "utf8");
}

function avatarTriggerClasses(): string {
  const source = read("components/UserMenu.tsx");
  const start = source.indexOf("<button");
  assert.ok(start >= 0, "avatar button");
  const end = source.indexOf("</button>", start);
  return source.slice(start, end);
}

describe("Cap5.3 avatar trigger chrome", () => {
  it("trigger binds --app-* surface/hover/focus (no sky-*)", () => {
    const btn = avatarTriggerClasses();
    assert.match(btn, /rounded-full/);
    assert.match(btn, /h-10 w-10/);
    assert.match(btn, /bg-\[var\(--app-primary\)\]/);
    assert.match(btn, /text-\[var\(--app-primary-foreground\)\]/);
    assert.match(btn, /hover:bg-\[var\(--app-primary-hover\)\]/);
    assert.match(btn, /ring-\[var\(--app-focus-ring\)\]/);
    assert.match(btn, /ring-offset-\[var\(--app-background\)\]/);
    assert.doesNotMatch(btn, /bg-sky-700|hover:bg-sky-800|ring-sky-500/);
  });

  it("dropdown menu panel behaviour/styles left untouched", () => {
    const source = read("components/UserMenu.tsx");
    assert.match(source, /role="menu"/);
    assert.match(
      source,
      /rounded-xl border border-slate-200 bg-white py-1 shadow-lg/,
    );
    assert.match(source, /logout\(\)/);
    assert.match(source, /aria-haspopup="menu"/);
  });
});
