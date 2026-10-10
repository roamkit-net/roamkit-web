import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { PartnerCustomerPlan } from "./client";
import { formatEsimDateTime } from "@/lib/esim/display";

import {
  customerColumnCount,
  planDataAllowance,
  planDestination,
  planExpiry,
  planUpdatedAt,
  planUsage,
  plansCacheKey,
  plansResponseIsCurrent,
} from "./customerPlans";

function plan(overrides: Partial<PartnerCustomerPlan> = {}): PartnerCustomerPlan {
  return {
    location_title: "Croatia",
    package_title: "Croatia 5 GB - 30 Days",
    data_allowance: "5 GB",
    validity_days: 30,
    status: "in_use",
    usage_remaining_mb: 4123,
    usage_total_mb: 5120,
    usage_is_unlimited: false,
    usage_expired_at: "2026-11-08T12:00:00Z",
    usage_synced_at: "2026-10-10T17:42:00Z",
    created_at: "2026-10-01T08:10:00Z",
    ...overrides,
  };
}

describe("customer plan display", () => {
  it("falls back from an empty location to the package title, then an em dash", () => {
    assert.equal(planDestination(plan({ location_title: "" })), "Croatia 5 GB - 30 Days");
    assert.equal(
      planDestination(plan({ location_title: "", package_title: "" })),
      "—",
    );
  });

  it("renders an empty allowance as an em dash", () => {
    assert.equal(planDataAllowance(plan({ data_allowance: "" })), "—");
  });

  it("keeps null unlimited distinct from false", () => {
    assert.equal(planUsage(plan({ usage_is_unlimited: true })), "Unlimited");
    assert.equal(planUsage(plan({ usage_is_unlimited: false })), "4123 / 5120 MB");
    assert.equal(
      planUsage(
        plan({
          usage_is_unlimited: false,
          usage_remaining_mb: null,
          usage_total_mb: null,
        }),
      ),
      "—",
    );
    assert.equal(planUsage(plan({ usage_is_unlimited: null })), "Usage not synced");
  });

  it("formats the updated time the same way as expiry", () => {
    const row = plan();
    assert.equal(planUpdatedAt(row), formatEsimDateTime(row.usage_synced_at));
    assert.equal(planUpdatedAt(row), planExpiry({ ...row, usage_expired_at: row.usage_synced_at }));
    assert.equal(planUpdatedAt(plan({ usage_synced_at: null })), "—");
  });

  it("scopes the cache by channel and customer and ignores a late channel", () => {
    assert.equal(plansCacheKey("channel-a", 6), "channel-a:6");
    assert.equal(plansCacheKey("channel-b", 6), "channel-b:6");
    assert.equal(plansResponseIsCurrent("channel-a", "channel-a"), true);
    assert.equal(plansResponseIsCurrent("channel-a", "channel-b"), false);
  });

  it("counts the columns that are actually visible", () => {
    assert.equal(
      customerColumnCount({
        showBalance: true,
        showEarned: true,
        showAccruals: true,
        canGrant: true,
      }),
      6,
    );
    assert.equal(
      customerColumnCount({
        showBalance: false,
        showEarned: false,
        showAccruals: false,
        canGrant: false,
      }),
      2,
    );
  });
});
