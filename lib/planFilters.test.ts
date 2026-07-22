import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  filterPackagesByPlan,
  resolveActivePlanFilter,
  shouldShowPlanFilter,
} from "./planFilters";

describe("shouldShowPlanFilter", () => {
  it("is true when unlimited and standard both exist", () => {
    assert.equal(
      shouldShowPlanFilter([
        { is_unlimited: true },
        { is_unlimited: false },
      ]),
      true,
    );
  });

  it("is false for only-standard catalogs (e.g. africa/world without unlimited SKUs)", () => {
    assert.equal(
      shouldShowPlanFilter([
        { is_unlimited: false },
        { is_unlimited: false },
      ]),
      false,
    );
  });

  it("is false for only-unlimited catalogs", () => {
    assert.equal(shouldShowPlanFilter([{ is_unlimited: true }]), false);
  });

  it("does not depend on coverage type — mixed regional/global packages still show", () => {
    assert.equal(
      shouldShowPlanFilter([
        { is_unlimited: true },
        { is_unlimited: false },
        { is_unlimited: false },
      ]),
      true,
    );
  });
});

describe("resolveActivePlanFilter", () => {
  it("falls back to standard when unlimited is empty", () => {
    assert.equal(
      resolveActivePlanFilter("unlimited", [{ is_unlimited: false }]),
      "standard",
    );
  });
});

describe("filterPackagesByPlan", () => {
  it("splits unlimited vs standard", () => {
    const packages = [
      { is_unlimited: true, id: "u" },
      { is_unlimited: false, id: "s" },
    ];
    assert.deepEqual(filterPackagesByPlan(packages, "unlimited"), [
      packages[0],
    ]);
    assert.deepEqual(filterPackagesByPlan(packages, "standard"), [packages[1]]);
  });
});
