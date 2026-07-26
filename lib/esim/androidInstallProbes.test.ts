import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { buildAndroidInstallProbes } from "@/lib/esim/androidInstallProbes";

describe("buildAndroidInstallProbes", () => {
  it("returns empty for blank input", () => {
    assert.deepEqual(buildAndroidInstallProbes(""), []);
    assert.deepEqual(buildAndroidInstallProbes("   "), []);
  });

  it("builds labeled LPA and intent variants without leaking structure errors", () => {
    const probes = buildAndroidInstallProbes("LPA:1$host.example$CODE");
    assert.equal(probes.length, 6);
    assert.deepEqual(
      probes.map((p) => p.id),
      [
        "lpa",
        "lpa-lower",
        "intent",
        "intent-noslash",
        "intent-encoded",
        "intent-phone",
      ],
    );
    assert.equal(probes[0]?.uri, "LPA:1$host.example$CODE");
    assert.equal(probes[1]?.uri, "lpa:1$host.example$CODE");
    assert.ok(probes[2]?.uri.startsWith("intent://1$host.example$CODE#Intent;"));
    assert.ok(probes[3]?.uri.startsWith("intent:1$host.example$CODE#Intent;"));
    assert.ok(probes[4]?.uri.includes("%24"));
    assert.ok(probes[5]?.uri.includes("package=com.android.phone"));
    for (const probe of probes) {
      assert.ok(probe.label.startsWith("Install ("));
      assert.ok(probe.scheme === "lpa" || probe.scheme === "intent");
    }
  });
});
