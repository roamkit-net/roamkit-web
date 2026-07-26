import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { detectInstallDevice } from "@/lib/esim/device";
import { parseLpa } from "@/lib/esim/lpa";
import {
  activationPolicyMessage,
  needsSetup,
} from "@/lib/esim/telemetry";

describe("esim setup helpers", () => {
  it("parseLpa extracts SM-DP+ and activation code", () => {
    const parsed = parseLpa("LPA:1$lpa.example.com$ACT-123");
    assert.deepEqual(parsed, {
      raw: "LPA:1$lpa.example.com$ACT-123",
      smdpAddress: "lpa.example.com",
      activationCode: "ACT-123",
    });
    assert.equal(parseLpa(""), null);
    assert.equal(parseLpa("   "), null);
    assert.deepEqual(parseLpa("not-an-lpa"), {
      raw: "not-an-lpa",
      smdpAddress: "",
      activationCode: "",
    });
  });

  it("detectInstallDevice classifies UA", () => {
    assert.equal(
      detectInstallDevice(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)",
      ),
      "iphone",
    );
    assert.equal(
      detectInstallDevice("Mozilla/5.0 (Linux; Android 14; Pixel 8)"),
      "android",
    );
    assert.equal(
      detectInstallDevice("Mozilla/5.0 (Windows NT 10.0; Win64; x64)"),
      "desktop",
    );
  });

  it("needsSetup respects completed and terminal statuses", () => {
    assert.equal(
      needsSetup({
        setup_completed_at: null,
        setup_skipped_at: null,
        status: "purchased",
      }),
      true,
    );
    assert.equal(
      needsSetup({
        setup_completed_at: "2026-07-26T00:00:00Z",
        setup_skipped_at: null,
        status: "purchased",
      }),
      false,
    );
    assert.equal(
      needsSetup({
        setup_completed_at: null,
        setup_skipped_at: null,
        status: "activated",
      }),
      false,
    );
  });

  it("needsSetup treats legacy active as done", () => {
    assert.equal(
      needsSetup({
        setup_completed_at: null,
        setup_skipped_at: null,
        status: "active",
      }),
      false,
    );
  });

  it("activationPolicyMessage covers known policies", () => {
    assert.match(activationPolicyMessage("first_usage"), /activated/i);
    assert.match(activationPolicyMessage("installation"), /installation/i);
    assert.match(activationPolicyMessage(undefined), /unknown/i);
  });
});
