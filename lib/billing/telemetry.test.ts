import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { billingTelemetry, createBillingTelemetry } from "./telemetry";

describe("billingTelemetry", () => {
  it("is a no-op that never throws", () => {
    assert.doesNotThrow(() => {
      billingTelemetry.track("deposit_page_open");
      billingTelemetry.track("deposit_verify_failed", {
        code: "INVALID_TX",
        amount: 10,
        ok: false,
        unused: null,
      });
      billingTelemetry.track("custom_event" as never);
    });
  });

  it("swallows sink errors so callers never see them", () => {
    const telemetry = createBillingTelemetry(() => {
      throw new Error("analytics down");
    });
    assert.doesNotThrow(() => {
      telemetry.track("deposit_page_open", { path: "/me/deposit" });
    });
  });
});
