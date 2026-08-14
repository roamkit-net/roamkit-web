import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { join } from "node:path";

/**
 * Isolation contract: details card uses the usage clock helper and does not
 * change Paid / ICCID / LPA, the list, or the Packages card.
 */
describe("eSIM detail live Data/Validity contract", () => {
  const detailPage = readFileSync(
    join(process.cwd(), "app/me/esims/[id]/page.tsx"),
    "utf8",
  );
  const listSection = readFileSync(
    join(process.cwd(), "components/esim/EsimListSection.tsx"),
    "utf8",
  );
  const packagesCard = readFileSync(
    join(process.cwd(), "components/esim/EsimPackagesCard.tsx"),
    "utf8",
  );

  it("resolves Data/Validity via esimDetailsLabels and drops issued/activated rows", () => {
    assert.match(detailPage, /esimDetailsLabels/);
    assert.doesNotMatch(detailPage, /Issued at/);
    assert.doesNotMatch(detailPage, /Activated at/);
    assert.doesNotMatch(detailPage, /formatEsimDateTime/);
  });

  it("keeps Paid, ICCID, and LPA on the details card", () => {
    assert.match(detailPage, />Paid</);
    assert.match(detailPage, />ICCID</);
    assert.match(detailPage, />LPA</);
    assert.match(detailPage, /CatalogPriceDisplay amount=\{esim\.paid_usd\}/);
    assert.match(detailPage, /\{esim\.iccid\}/);
    assert.match(detailPage, /\{esim\.lpa\}/);
  });

  it("does not change My eSIMs list snapshot fields", () => {
    assert.match(listSection, /esimValidityLabel/);
    assert.match(listSection, /esim\.data_allowance/);
    assert.doesNotMatch(listSection, /esimDetailsLabels/);
  });

  it("does not change Packages card headline source", () => {
    assert.match(packagesCard, /usageBarModel/);
    assert.match(packagesCard, /Expires on/);
    assert.doesNotMatch(packagesCard, /esimDetailsLabels/);
  });
});
