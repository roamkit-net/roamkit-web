import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";

/**
 * Guard: landing Header must paint above the hero.
 * Hero must not create an isolating stacking context that can cover the overlay nav.
 */
describe("landing header stacking", () => {
  it("places Header after HeroSection with shell z-header", () => {
    const src = readFileSync(join(process.cwd(), "app/page.tsx"), "utf8");
    const hero = src.indexOf("<HeroSection");
    const headerWrap = src.indexOf("z-[var(--z-header)]");
    const header = src.indexOf("<Header");
    assert.ok(hero >= 0, "HeroSection present");
    assert.ok(headerWrap >= 0, "header uses --z-header");
    assert.ok(header > hero, "Header must follow HeroSection in DOM");
  });

  it("HeroSection does not use isolate", () => {
    const src = readFileSync(
      join(process.cwd(), "components/landing/HeroSection.tsx"),
      "utf8",
    );
    assert.doesNotMatch(src, /\bisolate\b/);
  });
});
