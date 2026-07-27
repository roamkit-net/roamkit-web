import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildAndroidInstallAction,
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

describe("buildAndroidInstallAction", () => {
  it("returns null for blank input", () => {
    assert.equal(buildAndroidInstallAction(""), null);
  });

  it("returns universal Install eSIM action only", () => {
    const action = buildAndroidInstallAction("LPA:1$host.example$CODE");
    assert.ok(action);
    assert.equal(action?.id, "android-universal");
    assert.equal(action?.label, "Install eSIM");
    assert.equal(action?.scheme, "https");
    assert.ok(action?.uri.includes("esimsetup.android.com"));
  });
});
