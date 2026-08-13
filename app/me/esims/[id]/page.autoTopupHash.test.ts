import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Composition contract: #auto-topup focuses the wrapper, not Save/Enable/Turn off.
 */
describe("#auto-topup deep-link on eSIM detail", () => {
  const source = readFileSync(
    join(process.cwd(), "app/me/esims/[id]/page.tsx"),
    "utf8",
  );

  it("wraps AutoTopupControls in a tabIndex=-1 hash target", () => {
    assert.match(source, /id=\{AUTO_TOPUP_SECTION_ID\}/);
    assert.match(source, /tabIndex=\{-1\}/);
    assert.match(
      source,
      /<section[\s\S]*?<AutoTopupControls esimId=\{esimId\} topups=\{topups\} \/>[\s\S]*?<\/section>/,
    );
  });

  it("scrolls and focuses the wrapper only when the hash is present", () => {
    const helper = readFileSync(
      join(process.cwd(), "lib/esim/autoTopupHash.ts"),
      "utf8",
    );
    assert.match(source, /isAutoTopupHash\(window\.location\.hash\)/);
    assert.match(source, /focusAutoTopupSection\(autoTopupRef\.current\)/);
    assert.match(helper, /focus\(\{ preventScroll: true \}\)/);
    assert.doesNotMatch(source, /\.focus\(\)/);
  });
});
