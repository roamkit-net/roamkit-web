import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  billingTelemetry,
  createBillingTelemetry,
  DEPOSIT_TELEMETRY_EVENTS,
  type DepositTelemetryEvent,
} from "./telemetry";

/** Pre-PR0 deposit events — must remain on the frozen catalog. */
const LEGACY_DEPOSIT_EVENTS = [
  "deposit_page_open",
  "deposit_qr_generated",
  "deposit_verify_clicked",
  "deposit_verify_succeeded",
  "deposit_verify_failed",
  "deposit_poll_started",
  "deposit_poll_stopped",
  "deposit_poll_timed_out",
] as const satisfies ReadonlyArray<DepositTelemetryEvent>;

/** PR0 additions — typed union + catalog; UX emits in later PRs. */
const PR0_DEPOSIT_EVENTS = [
  "deposit_network_warning_seen",
  "deposit_explorer_opened",
  "deposit_retry_clicked",
  "deposit_retry_success",
  "deposit_pending_resumed",
  "deposit_copy_address_clicked",
] as const satisfies ReadonlyArray<DepositTelemetryEvent>;

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

  it("accepts all locked deposit catalog events without throwing", () => {
    const seen: string[] = [];
    const telemetry = createBillingTelemetry((event) => {
      seen.push(event);
    });
    assert.doesNotThrow(() => {
      for (const event of DEPOSIT_TELEMETRY_EVENTS) {
        telemetry.track(event);
      }
    });
    assert.deepEqual(seen, [...DEPOSIT_TELEMETRY_EVENTS]);
  });

  it("keeps legacy deposit event names on the frozen catalog", () => {
    for (const event of LEGACY_DEPOSIT_EVENTS) {
      assert.ok(
        (DEPOSIT_TELEMETRY_EVENTS as readonly string[]).includes(event),
        `missing legacy event: ${event}`,
      );
    }
  });

  it("includes PR0 deposit usability events on the frozen catalog", () => {
    for (const event of PR0_DEPOSIT_EVENTS) {
      assert.ok(
        (DEPOSIT_TELEMETRY_EVENTS as readonly string[]).includes(event),
        `missing PR0 event: ${event}`,
      );
    }
  });
});
