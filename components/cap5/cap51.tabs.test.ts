import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Cap5.1 — Tabs theme binding via --app-* (pilot; no new ui/Tabs).
 */

const ROOT = process.cwd();

function read(rel: string): string {
  return readFileSync(join(ROOT, rel), "utf8");
}

describe("Cap5.1 tabs theme binding", () => {
  it("PlansStore tabs use --app-* (no sky-700)", () => {
    const source = read("components/PlansStore.tsx");
    assert.match(source, /role="tablist"/);
    assert.match(source, /bg-\[var\(--app-primary\)\]/);
    assert.match(source, /text-\[var\(--app-primary-foreground\)\]/);
    assert.match(source, /text-\[var\(--app-chrome-text-muted\)\]/);
    assert.match(source, /border-\[var\(--app-border-chrome\)\]/);
    assert.match(source, /ring-\[var\(--app-focus-ring\)\]/);
    assert.doesNotMatch(source, /bg-sky-700/);
  });

  it("LocationDetail ServiceTab uses --app-* (theme only)", () => {
    const source = read("components/LocationDetail.tsx");
    const start = source.indexOf("function ServiceTab");
    assert.ok(start >= 0, "ServiceTab");
    const end = source.indexOf("\nfunction SegmentButton", start);
    const tab = source.slice(start, end > start ? end : undefined);
    assert.match(tab, /border-\[var\(--app-primary\)\]/);
    assert.match(tab, /text-\[var\(--app-text\)\]/);
    assert.match(tab, /text-\[var\(--app-text-muted\)\]/);
    assert.match(tab, /ring-\[var\(--app-focus-ring\)\]/);
    assert.doesNotMatch(tab, /border-slate-900|text-slate-900|text-slate-400/);
  });

  it("tab navigation / SegmentButton filter left untouched", () => {
    const plans = read("components/PlansStore.tsx");
    assert.match(plans, /params\.set\("tab", tab\)/);
    assert.match(plans, /aria-selected=\{isActive\}/);
    const detail = read("components/LocationDetail.tsx");
    assert.match(detail, /function SegmentButton/);
    // Cap5.1 must not theme SegmentButton (out of slice).
    const segStart = detail.indexOf("function SegmentButton");
    const seg = detail.slice(segStart);
    assert.match(seg, /bg-slate-900/);
  });
});
