import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { Esim } from "@/lib/api";
import {
  actionRequiredEsims,
  esimActionRequiredSubtitle,
  esimDestinationLabel,
  esimDetailsLabels,
  esimValidityLabel,
  formatEsimStatus,
  getEsimActionRequiredReason,
  isActionRequiredEsim,
  partitionMyEsims,
  truncateNote,
} from "@/lib/esim/display";

function baseEsim(overrides: Partial<Esim> = {}): Esim {
  return {
    id: 1,
    iccid: "8901",
    lpa: "",
    matching_id: "",
    qrcode: "",
    qrcode_url: "",
    direct_apple_installation_url: "",
    manual_installation: "",
    qrcode_installation: "",
    installation_guide_url: "",
    status: "expired",
    usage_remaining_mb: null,
    usage_total_mb: null,
    usage_status: null,
    usage_is_unlimited: null,
    usage_expired_at: null,
    usage_synced_at: null,
    archived_at: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("esim display helpers", () => {
  it("formats lifecycle status for badges", () => {
    assert.equal(formatEsimStatus("expired"), "Expired");
    assert.equal(formatEsimStatus("in_use"), "In Use");
    assert.equal(formatEsimStatus(""), "eSIM");
  });

  it("prefers location title for list destination", () => {
    assert.equal(
      esimDestinationLabel(
        baseEsim({ location_title: "Croatia", package_title: "1 GB - 7 days" }),
      ),
      "Croatia",
    );
    assert.equal(
      esimDestinationLabel(baseEsim({ package_title: "1 GB - 7 days" })),
      "1 GB - 7 days",
    );
  });

  it("formats validity days", () => {
    assert.equal(esimValidityLabel(baseEsim({ validity_days: 7 })), "7 days");
    assert.equal(esimValidityLabel(baseEsim({ validity_days: 1 })), "1 day");
    assert.equal(esimValidityLabel(baseEsim({ validity_days: null })), null);
  });

  describe("esimDetailsLabels", () => {
    const now = Date.parse("2026-08-14T11:32:00Z");
    const expiry = "2026-08-26T08:50:16Z";
    const snapshot = {
      data_allowance: "300 MB",
      validity_days: 3,
    } as const;

    it("uses live usage total and remaining days to expiry", () => {
      const labels = esimDetailsLabels(
        baseEsim({
          ...snapshot,
          usage_total_mb: 100,
          usage_expired_at: "2026-08-20T00:00:00Z",
        }),
        {
          total_mb: 2048,
          is_unlimited: false,
          expired_at: expiry,
        },
        now,
      );
      assert.deepEqual(labels, { data: "2 GB", validity: "12 days" });
    });

    it("shows Unlimited when live is_unlimited is true", () => {
      const labels = esimDetailsLabels(
        baseEsim({ ...snapshot, usage_total_mb: 2048 }),
        { is_unlimited: true, total_mb: 2048, expired_at: expiry },
        now,
      );
      assert.equal(labels.data, "Unlimited");
      assert.equal(labels.validity, "12 days");
    });

    it("keeps live fields and fills only missing ones from cache", () => {
      const labels = esimDetailsLabels(
        baseEsim({
          ...snapshot,
          usage_total_mb: 512,
          usage_expired_at: expiry,
        }),
        { total_mb: 2048, is_unlimited: false },
        now,
      );
      assert.deepEqual(labels, { data: "2 GB", validity: "12 days" });
    });

    it("treats 0 MB as a real total and does not fall back to snapshot", () => {
      const labels = esimDetailsLabels(
        baseEsim(snapshot),
        { total_mb: 0, is_unlimited: false, expired_at: expiry },
        now,
      );
      assert.equal(labels.data, "0 MB");
      assert.equal(labels.validity, "12 days");
    });

    it("clamps past expiry to 0 days", () => {
      const labels = esimDetailsLabels(
        baseEsim(snapshot),
        {
          total_mb: 2048,
          is_unlimited: false,
          expired_at: "2026-08-01T00:00:00Z",
        },
        now,
      );
      assert.equal(labels.validity, "0 days");
    });

    it("skips invalid live expiry and uses cache, then snapshot", () => {
      const fromCache = esimDetailsLabels(
        baseEsim({ ...snapshot, usage_expired_at: expiry }),
        { total_mb: 2048, expired_at: "not-a-date" },
        now,
      );
      assert.equal(fromCache.validity, "12 days");
      assert.equal(fromCache.data, "2 GB");

      const fromSnapshot = esimDetailsLabels(
        baseEsim({ ...snapshot, usage_expired_at: "also-bad" }),
        { total_mb: 2048, expired_at: "not-a-date" },
        now,
      );
      assert.equal(fromSnapshot.validity, "3 days");
      assert.doesNotMatch(fromSnapshot.validity, /NaN|Invalid Date/);
    });

    it("falls back to purchase snapshot when usage is missing", () => {
      const labels = esimDetailsLabels(baseEsim(snapshot), null, now);
      assert.deepEqual(labels, { data: "300 MB", validity: "3 days" });
    });

    it("uses a neutral dash when no valid source exists", () => {
      const labels = esimDetailsLabels(baseEsim(), null, now);
      assert.deepEqual(labels, { data: "—", validity: "—" });
    });
  });

  it("truncates notes for list preview", () => {
    assert.equal(truncateNote(""), "");
    assert.equal(truncateNote("   "), "");
    assert.equal(truncateNote("Japan trip"), "Japan trip");
    assert.equal(
      truncateNote("x".repeat(48)),
      "x".repeat(48),
    );
    assert.equal(
      truncateNote("x".repeat(49)),
      `${"x".repeat(48)}…`,
    );
    assert.equal(truncateNote("  short  "), "short");
  });

  it("partitions Active / Expired / Archived with locked sort", () => {
    const sections = partitionMyEsims([
      baseEsim({
        id: 1,
        status: "in_use",
        issued_at: "2026-01-01T00:00:00Z",
        created_at: "2026-01-01T00:00:00Z",
      }),
      baseEsim({
        id: 2,
        status: "exhausted",
        issued_at: "2026-02-01T00:00:00Z",
        created_at: "2026-02-01T00:00:00Z",
      }),
      baseEsim({
        id: 3,
        status: "expired",
        usage_expired_at: "2026-03-01T00:00:00Z",
        issued_at: "2026-01-15T00:00:00Z",
      }),
      baseEsim({
        id: 4,
        status: "expired",
        usage_expired_at: "2026-04-01T00:00:00Z",
        issued_at: "2026-01-10T00:00:00Z",
      }),
      baseEsim({
        id: 5,
        status: "expired",
        archived_at: "2026-05-01T00:00:00Z",
      }),
      baseEsim({
        id: 6,
        status: "in_use",
        archived_at: "2026-06-01T00:00:00Z",
      }),
    ]);

    assert.deepEqual(
      sections.active.map((e) => e.id),
      [2, 1],
    );
    assert.deepEqual(
      sections.expired.map((e) => e.id),
      [4, 3],
    );
    assert.deepEqual(
      sections.archived.map((e) => e.id),
      [6, 5],
    );
  });

  it("includes exact Action required pairs, including expired, not archived", () => {
    const pausedFunds = {
      enabled: true,
      status: "paused",
      reason: "insufficient_funds",
    } as const;
    const blockedPackage = {
      enabled: true,
      status: "blocked",
      reason: "package_unavailable",
    } as const;

    const items = actionRequiredEsims([
      baseEsim({
        id: 1,
        status: "in_use",
        auto_topup: pausedFunds,
      }),
      baseEsim({
        id: 2,
        status: "expired",
        auto_topup: pausedFunds,
      }),
      baseEsim({
        id: 3,
        status: "expired",
        archived_at: "2026-05-01T00:00:00Z",
        auto_topup: pausedFunds,
      }),
      baseEsim({
        id: 4,
        status: "in_use",
        auto_topup: {
          enabled: true,
          status: "paused",
          reason: "package_unavailable",
        },
      }),
      baseEsim({
        id: 5,
        status: "in_use",
        auto_topup: null,
      }),
      baseEsim({
        id: 6,
        status: "in_use",
        auto_topup: {
          enabled: false,
          status: "paused",
          reason: "insufficient_funds",
        },
      }),
      baseEsim({
        id: 7,
        status: "in_use",
        auto_topup: blockedPackage,
      }),
      baseEsim({
        id: 8,
        status: "expired",
        auto_topup: blockedPackage,
      }),
      baseEsim({
        id: 9,
        status: "in_use",
        archived_at: "2026-05-01T00:00:00Z",
        auto_topup: blockedPackage,
      }),
    ]);

    assert.deepEqual(
      items.map((e) => e.id),
      [1, 2, 7, 8],
    );
  });

  it("resolves Action required copy from exact pairs and fails closed otherwise", () => {
    const pausedFunds = baseEsim({
      auto_topup: {
        enabled: true,
        status: "paused",
        reason: "insufficient_funds",
      },
    });
    const blockedPackage = baseEsim({
      auto_topup: {
        enabled: true,
        status: "blocked",
        reason: "package_unavailable",
      },
    });

    assert.equal(getEsimActionRequiredReason(pausedFunds), "insufficient_funds");
    assert.equal(getEsimActionRequiredReason(blockedPackage), "package_unavailable");
    assert.equal(isActionRequiredEsim(pausedFunds), true);
    assert.equal(isActionRequiredEsim(blockedPackage), true);
    assert.equal(
      esimActionRequiredSubtitle("insufficient_funds"),
      "Auto top-up paused · Insufficient funds",
    );
    assert.equal(
      esimActionRequiredSubtitle("package_unavailable"),
      "Auto top-up blocked · Package unavailable",
    );

    const negatives = [
      baseEsim({ auto_topup: null }),
      baseEsim({
        auto_topup: {
          enabled: false,
          status: "paused",
          reason: "insufficient_funds",
        },
      }),
      baseEsim({
        auto_topup: {
          enabled: false,
          status: "blocked",
          reason: "package_unavailable",
        },
      }),
      baseEsim({
        auto_topup: {
          enabled: true,
          status: "paused",
          reason: "package_unavailable",
        },
      }),
      baseEsim({
        auto_topup: {
          enabled: true,
          status: "blocked",
          reason: "insufficient_funds",
        },
      }),
      baseEsim({
        auto_topup: {
          enabled: true,
          status: "paused",
          reason: "count_exhausted",
        },
      }),
      baseEsim({
        auto_topup: {
          enabled: true,
          status: "paused",
          reason: "schedule_ended",
        },
      }),
      baseEsim({
        auto_topup: {
          enabled: true,
          status: "disabled",
          reason: "manual_pause",
        },
      }),
      baseEsim({
        auto_topup: {
          enabled: true,
          status: "paused",
          reason: "usage_unknown",
        },
      }),
      baseEsim({
        auto_topup: {
          enabled: true,
          status: "paused",
          reason: "provider_error",
        },
      }),
      baseEsim({
        auto_topup: {
          enabled: true,
          status: "active",
          reason: "",
        },
      }),
      baseEsim({
        archived_at: "2026-05-01T00:00:00Z",
        auto_topup: {
          enabled: true,
          status: "paused",
          reason: "insufficient_funds",
        },
      }),
    ];

    for (const esim of negatives) {
      assert.equal(getEsimActionRequiredReason(esim), null);
      assert.equal(isActionRequiredEsim(esim), false);
    }
  });
});
