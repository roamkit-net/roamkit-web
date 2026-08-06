import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Cap3.3a Golden Route — composition contract (no full page mount).
 * Ensures shell chrome text + Cap2 elevated primitives stay wired.
 */
describe("Cap3.3a /me/esims Golden Route", () => {
  const source = readFileSync(
    join(process.cwd(), "app/me/esims/page.tsx"),
    "utf8",
  );

  it("uses chrome text tokens on the page header (dark shell)", () => {
    assert.match(
      source,
      /eyebrow=\{\s*<p className="[^"]*text-\[var\(--app-chrome-text-muted\)\]/,
    );
    assert.match(
      source,
      /title=\{\s*<h1 className="[^"]*text-\[var\(--app-chrome-text\)\]/,
    );
    assert.match(
      source,
      /description=\{\s*<p className="[^"]*text-\[var\(--app-chrome-text-muted\)\]/,
    );
  });

  it("keeps Cap2 elevated surfaces (Card / ListRow / Empty / Alert)", () => {
    assert.match(source, /from "@\/components\/ui\/Card"/);
    assert.match(source, /listRowClassName/);
    assert.match(source, /from "@\/components\/ui\/Empty"/);
    assert.match(source, /from "@\/components\/ui\/Alert"/);
    assert.match(source, /ListSkeleton/);
  });

  it("does not introduce a local layout wrapper class", () => {
    assert.doesNotMatch(source, /className="[^"]*min-h-screen/);
    assert.doesNotMatch(source, /bg-slate-50/);
  });
});
