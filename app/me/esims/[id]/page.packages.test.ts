import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { join } from "node:path";

/**
 * Isolation contract: package history must not take down the eSIM detail page.
 */
describe("eSIM detail packages isolation", () => {
  const source = readFileSync(
    join(process.cwd(), "app/me/esims/[id]/page.tsx"),
    "utf8",
  );

  it("fetches packages separately from detail and top-ups", () => {
    assert.match(source, /fetchMyEsimPackages/);
    assert.match(source, /Promise\.allSettled/);
    assert.match(source, /setPackagesError/);
    assert.doesNotMatch(
      source,
      /const \[detail, topupList, .*packages/,
    );
  });

  it("coordinates usage and package refresh behind one in-flight guard", () => {
    assert.match(source, /refreshInFlightRef/);
    assert.match(source, /refreshUsageAndPackages/);
    assert.match(source, /fetchMyEsimUsage/);
    assert.match(source, /fetchMyEsimPackages/);
  });

  it("renders Packages card and keeps buy top-ups + auto-topup", () => {
    assert.match(source, /<EsimPackagesCard/);
    assert.match(source, /<AutoTopupControls/);
    assert.match(source, /Available top-ups/);
    assert.doesNotMatch(source, />Usage</);
  });
});
