import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildAndroidInstallProbes,
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

describe("buildAndroidInstallProbes", () => {
  it("returns empty for blank input", () => {
    assert.deepEqual(buildAndroidInstallProbes(""), []);
  });

  it("prioritizes Android universal link and Settings bridges", () => {
    const probes = buildAndroidInstallProbes("LPA:1$host.example$CODE");
    assert.deepEqual(
      probes.map((p) => p.id),
      [
        "android-universal",
        "android-universal-raw",
        "settings-network",
        "settings-network-dashboard",
        "intent-manage-sims",
        "lpa",
      ],
    );
    assert.equal(probes[0]?.scheme, "https");
    assert.ok(probes[0]?.uri.includes("esimsetup.android.com"));
    assert.ok(probes[0]?.uri.includes("carddata="));
    assert.ok(probes[1]?.uri.includes("carddata=LPA:1$host.example$CODE"));
    assert.ok(
      probes[2]?.uri.includes("android.settings.NETWORK_OPERATOR_SETTINGS"),
    );
  });
});
