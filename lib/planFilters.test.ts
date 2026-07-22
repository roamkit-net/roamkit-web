import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  filterPackagesByPlan,
  resolveActivePlanFilter,
  shouldShowPlanFilter,
} from "./planFilters";

describe("shouldShowPlanFilter", () => {
  it("is true on Data when unlimited and standard both exist", () => {
    assert.equal(
      shouldShowPlanFilter(
        [{ is_unlimited: true }, { is_unlimited: false }],
        "data",
      ),
      true,
    );
  });

  it("defaults to Data when service type is omitted", () => {
    assert.equal(
      shouldShowPlanFilter([
        { is_unlimited: true },
        { is_unlimited: false },
      ]),
      true,
    );
  });

  it("is false for Data / Calls / Texts even when both flags exist", () => {
    assert.equal(
      shouldShowPlanFilter(
        [{ is_unlimited: true }, { is_unlimited: false }],
        "data_calls_texts",
      ),
      false,
    );
  });

  it("is false for only-standard catalogs", () => {
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
  it("splits unlimited vs standard on Data", () => {
    const packages = [
      { is_unlimited: true, id: "u" },
      { is_unlimited: false, id: "s" },
    ];
    assert.deepEqual(filterPackagesByPlan(packages, "unlimited", "data"), [
      packages[0],
    ]);
    assert.deepEqual(filterPackagesByPlan(packages, "standard", "data"), [
      packages[1],
    ]);
  });

  it("returns all packages for Data / Calls / Texts", () => {
    const packages = [
      { is_unlimited: true, id: "u" },
      { is_unlimited: false, id: "s" },
    ];
    assert.deepEqual(
      filterPackagesByPlan(packages, "unlimited", "data_calls_texts"),
      packages,
    );
  });
});
