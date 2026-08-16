import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { ApiError, type Location, type Package } from "@/lib/api";

import { resolveLocationPage } from "./locationLoader";

function location(partial?: Partial<Location>): Location {
  return {
    slug: "croatia",
    title: "Croatia",
    country_code: "HR",
    coverage_type: "local",
    image_url: "",
    is_popular: true,
    min_price_usd: "4.50",
    covered_country_codes: ["HR"],
    coverages: [],
    ...partial,
  };
}

function pkg(partial?: Partial<Package>): Package {
  return {
    id: "pkg-1",
    title: "1GB 7 days",
    operator_title: "Test",
    country_code: "HR",
    data_allowance: "1 GB",
    validity_days: 7,
    price_usd: "4.50",
    is_unlimited: false,
    plan_type: "data",
    voice_minutes: null,
    text_sms: null,
    ...partial,
  };
}

describe("resolveLocationPage", () => {
  it("returns FOUND when location and packages succeed", async () => {
    const result = await resolveLocationPage("croatia", {
      fetchLocation: async () => location(),
      fetchAllPackages: async () => [pkg()],
    });
    assert.equal(result.status, "FOUND");
    if (result.status === "FOUND") {
      assert.equal(result.data.location.slug, "croatia");
      assert.equal(result.data.packages.length, 1);
    }
  });

  it("returns NOT_FOUND for a location API 404", async () => {
    const result = await resolveLocationPage("missing", {
      fetchLocation: async () => {
        throw new ApiError("missing", 404);
      },
      fetchAllPackages: async () => {
        throw new Error("packages should not run");
      },
    });
    assert.equal(result.status, "NOT_FOUND");
  });

  it("returns NO_ACTIVE_PLAN only after a successful empty package list", async () => {
    const result = await resolveLocationPage("croatia", {
      fetchLocation: async () => location({ min_price_usd: null }),
      fetchAllPackages: async () => [],
    });
    assert.equal(result.status, "NO_ACTIVE_PLAN");
  });

  it("does not treat min_price_usd null as empty when packages exist", async () => {
    const result = await resolveLocationPage("croatia", {
      fetchLocation: async () => location({ min_price_usd: null }),
      fetchAllPackages: async () => [pkg()],
    });
    assert.equal(result.status, "FOUND");
  });

  it("returns UPSTREAM_ERROR for packages 500 and never NOT_FOUND", async () => {
    const result = await resolveLocationPage("croatia", {
      fetchLocation: async () => location(),
      fetchAllPackages: async () => {
        throw new ApiError("upstream", 500);
      },
    });
    assert.equal(result.status, "UPSTREAM_ERROR");
  });

  it("returns UPSTREAM_ERROR for location timeout/network errors", async () => {
    const result = await resolveLocationPage("croatia", {
      fetchLocation: async () => {
        throw new Error("timeout");
      },
      fetchAllPackages: async () => [pkg()],
    });
    assert.equal(result.status, "UPSTREAM_ERROR");
  });

  it("returns UPSTREAM_ERROR for an invalid location payload", async () => {
    const result = await resolveLocationPage("croatia", {
      fetchLocation: async () => location({ slug: "" }),
      fetchAllPackages: async () => [pkg()],
    });
    assert.equal(result.status, "UPSTREAM_ERROR");
  });

  it("returns UPSTREAM_ERROR for a non-array packages payload", async () => {
    const result = await resolveLocationPage("croatia", {
      fetchLocation: async () => location(),
      fetchAllPackages: async () => ({}) as unknown as Package[],
    });
    assert.equal(result.status, "UPSTREAM_ERROR");
  });
});
