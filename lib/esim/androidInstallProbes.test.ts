import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  ANDROID_NETWORK_DASHBOARD_URI,
  buildAndroidInstallActions,
  buildAndroidUniversalLink,
} from "@/lib/esim/androidInstallProbes";

describe("buildAndroidUniversalLink", () => {
  it("builds esimsetup.android.com carddata URL", () => {
    const uri = buildAndroidUniversalLink("LPA:1$host.example$CODE");
    assert.equal(
      uri,
      "https://esimsetup.android.com/esim_qrcode_provisioning?carddata=LPA%3A1%24host.example%24CODE",
    );
    assert.equal(buildAndroidUniversalLink(""), null);
  });
});

describe("buildAndroidInstallActions", () => {
  it("returns empty for blank input", () => {
    assert.deepEqual(buildAndroidInstallActions(""), []);
  });

  it("returns universal primary and Network dashboard secondary", () => {
    const actions = buildAndroidInstallActions("LPA:1$host.example$CODE");
    assert.deepEqual(
      actions.map((a) => a.id),
      ["android-universal", "settings-network-dashboard"],
    );
    assert.equal(actions[0]?.label, "Install eSIM");
    assert.equal(actions[0]?.scheme, "https");
    assert.ok(actions[0]?.uri.includes("esimsetup.android.com"));
    assert.equal(actions[1]?.uri, ANDROID_NETWORK_DASHBOARD_URI);
    assert.ok(actions[1]?.uri.includes("NetworkDashboardActivity"));
  });
});
