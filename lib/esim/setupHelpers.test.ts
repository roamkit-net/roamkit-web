import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  canUseAndroidDeepLink,
  canUseAppleInstallLink,
  detectInstallDevice,
  getAvailableInstallActions,
} from "@/lib/esim/device";
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
      detectInstallDevice(
        "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)",
      ),
      "iphone",
    );
    assert.equal(
      detectInstallDevice(
        "Mozilla/5.0 (iPod touch; CPU iPhone OS 15_0 like Mac OS X)",
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
    assert.equal(detectInstallDevice(""), "desktop");
  });

  it("canUseAppleInstallLink / getAvailableInstallActions by device", () => {
    const cases: Array<{
      label: string;
      ua: string;
      apple: boolean;
      androidDeepLink: boolean;
    }> = [
      {
        label: "iphone",
        ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)",
        apple: true,
        androidDeepLink: false,
      },
      {
        label: "ipad",
        ua: "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)",
        apple: true,
        androidDeepLink: false,
      },
      {
        label: "ipod",
        ua: "Mozilla/5.0 (iPod touch; CPU iPhone OS 15_0 like Mac OS X)",
        apple: true,
        androidDeepLink: false,
      },
      {
        label: "android",
        ua: "Mozilla/5.0 (Linux; Android 14; Pixel 8)",
        apple: false,
        androidDeepLink: true,
      },
      {
        label: "desktop",
        ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        apple: false,
        androidDeepLink: false,
      },
      { label: "unknown", ua: "", apple: false, androidDeepLink: false },
    ];

    for (const row of cases) {
      const device = detectInstallDevice(row.ua);
      assert.equal(
        canUseAppleInstallLink(device),
        row.apple,
        `${row.label}: canUseAppleInstallLink`,
      );
      assert.equal(
        canUseAndroidDeepLink(device),
        row.androidDeepLink,
        `${row.label}: canUseAndroidDeepLink`,
      );
      assert.equal(
        getAvailableInstallActions(device).appleInstall,
        row.apple,
        `${row.label}: appleInstall`,
      );
      assert.equal(
        getAvailableInstallActions(device).androidDeepLink,
        row.androidDeepLink,
        `${row.label}: androidDeepLink`,
      );
      assert.equal(getAvailableInstallActions(device).qrInstall, true);
      assert.equal(getAvailableInstallActions(device).manualInstall, true);
    }
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
