import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { buildAndroidInstallProbes } from "@/lib/esim/androidInstallProbes";

describe("buildAndroidInstallProbes", () => {
  it("returns empty for blank input", () => {
    assert.deepEqual(buildAndroidInstallProbes(""), []);
    assert.deepEqual(buildAndroidInstallProbes("   "), []);
  });

  it("builds OEM package and settings probes", () => {
    const probes = buildAndroidInstallProbes("LPA:1$host.example$CODE");
    assert.deepEqual(
      probes.map((p) => p.id),
      [
        "lpa",
        "intent",
        "intent-samsung",
        "intent-euicc",
        "intent-euicc-activate",
        "intent-manage-sims",
      ],
    );
    assert.equal(probes[0]?.uri, "LPA:1$host.example$CODE");
    assert.ok(
      probes[2]?.uri.includes("package=com.samsung.android.app.telephonyui"),
    );
    assert.ok(probes[3]?.uri.includes("package=com.google.android.euicc"));
    assert.ok(
      probes[4]?.uri.includes(
        "android.telephony.euicc.action.START_EUICC_ACTIVATION",
      ),
    );
    assert.ok(
      probes[5]?.uri.includes(
        "android.settings.MANAGE_ALL_SIM_PROFILES_SETTINGS",
      ),
    );
  });
});
