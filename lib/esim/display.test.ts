import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { Esim } from "@/lib/api";
import {
  esimDestinationLabel,
  esimValidityLabel,
  formatEsimStatus,
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
});
