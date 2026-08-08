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
  const sectionSource = readFileSync(
    join(process.cwd(), "components/esim/EsimListSection.tsx"),
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
    assert.match(source, /from "@\/components\/esim\/EsimListSection"/);
    assert.match(sectionSource, /listRowClassName/);
    assert.match(source, /from "@\/components\/ui\/Empty"/);
    assert.match(source, /from "@\/components\/ui\/Alert"/);
    assert.match(source, /ListSkeleton/);
  });

  it("groups list into Active / Expired / Archived with Archive and Restore", () => {
    assert.match(source, /title="Active"/);
    assert.match(source, /title="Expired"/);
    assert.match(source, /title="Archived"/);
    assert.match(source, /listId="esim-section-active"/);
    assert.match(source, /listId="esim-section-expired"/);
    assert.match(source, /listId="esim-section-archived"/);
    assert.match(source, /defaultOpen=\{false\}/);
    assert.match(sectionSource, /Archive/);
    assert.match(sectionSource, /Restore/);
    assert.match(source, /includeArchived:\s*true/);
    assert.match(source, /archiveMyEsim/);
    assert.match(source, /unarchiveMyEsim/);
  });

  it("uses h2 wrapping button collapse with aria-controls", () => {
    assert.match(sectionSource, /<h2[\s\S]*?<button[\s\S]*?aria-controls=\{listId\}/);
    assert.doesNotMatch(
      sectionSource,
      /<button[\s\S]*?<h2[\s\S]*?<\/h2>[\s\S]*?<\/button>/,
    );
    assert.match(sectionSource, /aria-expanded=\{open\}/);
    assert.match(sectionSource, /aria-hidden/);
    assert.doesNotMatch(sectionSource, /onKeyDown/);
    assert.doesNotMatch(sectionSource, /useEffect\(\s*\(\)\s*=>\s*setOpen/);
  });

  it("does not introduce a local layout wrapper class", () => {
    assert.doesNotMatch(source, /className="[^"]*min-h-screen/);
    assert.doesNotMatch(source, /bg-slate-50/);
  });
});
