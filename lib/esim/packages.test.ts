import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { AppliedPackage } from "@/lib/api";
import {
  appliedPackageKindLabel,
  appliedPackageStatusLabel,
  formatDataMb,
  formatPaidAmount,
  packageSpecLabel,
  partitionAppliedPackages,
  usageBarModel,
} from "@/lib/esim/packages";

function pkg(overrides: Partial<AppliedPackage> = {}): AppliedPackage {
  return {
    id: "1",
    kind: "topup",
    status: "active",
    data_allowance: "1 GB",
    validity_days: 7,
    is_unlimited: false,
    remaining_mb: 900,
    created_at: "2026-08-12T10:50:00Z",
    activated_at: "2026-08-12T10:50:00Z",
    expires_at: "2026-08-19T10:50:00Z",
    paid_usd: "3.20",
    currency: "USD",
    ...overrides,
  };
}

describe("partitionAppliedPackages", () => {
  it("puts not_active in Available, not Previous", () => {
    const grouped = partitionAppliedPackages([
      pkg({ id: "a", status: "not_active" }),
    ]);
    assert.equal(grouped.available.length, 1);
    assert.equal(grouped.previous.length, 0);
    assert.equal(grouped.unknown.length, 0);
  });

  it("splits active + not_active + expired together", () => {
    const grouped = partitionAppliedPackages([
      pkg({ id: "1", status: "active" }),
      pkg({ id: "2", status: "not_active" }),
      pkg({ id: "3", status: "expired" }),
    ]);
    assert.deepEqual(
      grouped.available.map((row) => row.id),
      ["1", "2"],
    );
    assert.deepEqual(
      grouped.previous.map((row) => row.id),
      ["3"],
    );
    assert.equal(grouped.unknown.length, 0);
  });

  it("keeps unknown out of Available and Previous", () => {
    const grouped = partitionAppliedPackages([
      pkg({ id: "u", status: "unknown" }),
      pkg({ id: "x", status: "something_new" }),
    ]);
    assert.equal(grouped.available.length, 0);
    assert.equal(grouped.previous.length, 0);
    assert.deepEqual(
      grouped.unknown.map((row) => row.id),
      ["u", "x"],
    );
  });

  it("puts finished in Previous", () => {
    const grouped = partitionAppliedPackages([
      pkg({ id: "f", status: "finished" }),
    ]);
    assert.equal(grouped.previous.length, 1);
  });
});

describe("applied package labels", () => {
  it("does not label unknown as Expired", () => {
    assert.equal(appliedPackageStatusLabel("unknown"), "Unknown");
    assert.equal(appliedPackageStatusLabel("weird"), "Unknown");
    assert.equal(appliedPackageStatusLabel("finished"), "Expired");
    assert.equal(appliedPackageStatusLabel("not_active"), "Not active");
  });

  it("labels kind and spec", () => {
    assert.equal(appliedPackageKindLabel("esim"), "eSIM");
    assert.equal(appliedPackageKindLabel("topup"), "Top-up");
    assert.equal(packageSpecLabel(pkg()), "1 GB · 7 days");
    assert.equal(
      packageSpecLabel(pkg({ is_unlimited: true, validity_days: 1 })),
      "Unlimited · 1 day",
    );
  });
});

describe("usageBarModel", () => {
  it("does not use MB math for unlimited", () => {
    assert.deepEqual(
      usageBarModel({
        remainingMb: 0,
        totalMb: 0,
        isUnlimited: true,
      }),
      { kind: "unlimited" },
    );
  });

  it("computes used as total minus remaining", () => {
    const model = usageBarModel({
      remainingMb: 1926,
      totalMb: 2048,
      isUnlimited: false,
    });
    assert.equal(model.kind, "metered");
    if (model.kind === "metered") {
      assert.equal(model.usedMb, 122);
      assert.equal(model.remainingPercent, 94);
      assert.equal(model.usedPercent, 6);
    }
  });
});

describe("formatters", () => {
  it("formats MB and GB", () => {
    assert.equal(formatDataMb(122), "122 MB");
    assert.equal(formatDataMb(1926), "1.88 GB");
    assert.equal(formatDataMb(2048), "2 GB");
  });

  it("formats paid amount or em dash", () => {
    assert.equal(formatPaidAmount("3.20", "USD"), "$3.20 USD");
    assert.equal(formatPaidAmount(null, "USD"), "—");
    assert.equal(formatPaidAmount("nope", "USD"), "—");
  });
});
