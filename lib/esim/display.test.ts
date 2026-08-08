import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { Esim } from "@/lib/api";
import {
  esimDestinationLabel,
  esimValidityLabel,
  formatEsimStatus,
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
});
