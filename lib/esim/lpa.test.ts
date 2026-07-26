import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  canAttemptDeepLink,
  isAndroidLpaDeepLinkEnabled,
} from "@/lib/esim/launchInstallAction";
import { buildLpaUri, parseLpa, resolveLpaUri } from "@/lib/esim/lpa";

describe("lpa helpers", () => {
  it("buildLpaUri builds GSMA format", () => {
    assert.equal(
      buildLpaUri("lpa.example.com", "ACT-123"),
      "LPA:1$lpa.example.com$ACT-123",
    );
    assert.equal(buildLpaUri("", "ACT"), null);
    assert.equal(buildLpaUri("host", ""), null);
  });

  it("buildLpaUri round-trips with parseLpa", () => {
    const uri = buildLpaUri("smdp.example", "CODE");
    assert.ok(uri);
    const parsed = parseLpa(uri!);
    assert.equal(parsed?.smdpAddress, "smdp.example");
    assert.equal(parsed?.activationCode, "CODE");
  });

  it("resolveLpaUri prefers valid existing lpa", () => {
    assert.equal(
      resolveLpaUri({
        lpa: "LPA:1$host$CODE",
        smdpAddress: "other",
        activationCode: "X",
      }),
      "LPA:1$host$CODE",
    );
    assert.equal(
      resolveLpaUri({ smdpAddress: "host", activationCode: "CODE" }),
      "LPA:1$host$CODE",
    );
  });

  it("parseLpa treats bare SM-DP+ host as address", () => {
    const parsed = parseLpa("lpa.airalo.com");
    assert.equal(parsed?.smdpAddress, "lpa.airalo.com");
    assert.equal(parsed?.activationCode, "");
    assert.equal(parseLpa("LPA:lpa.example.com")?.smdpAddress, "lpa.example.com");
  });

  it("resolveLpaUri builds from bare host + matching_id", () => {
    assert.equal(
      resolveLpaUri({
        lpa: "lpa.airalo.com",
        activationCode: "ACT-999",
      }),
      "LPA:1$lpa.airalo.com$ACT-999",
    );
    assert.equal(
      resolveLpaUri({ lpa: "lpa.airalo.com", activationCode: "" }),
      null,
    );
  });
});

describe("launchInstallAction flag", () => {
  it("isAndroidLpaDeepLinkEnabled defaults off", () => {
    const prev = process.env.NEXT_PUBLIC_ANDROID_LPA_DEEP_LINK;
    delete process.env.NEXT_PUBLIC_ANDROID_LPA_DEEP_LINK;
    assert.equal(isAndroidLpaDeepLinkEnabled(), false);
    assert.equal(canAttemptDeepLink(), false);
    process.env.NEXT_PUBLIC_ANDROID_LPA_DEEP_LINK = "1";
    assert.equal(isAndroidLpaDeepLinkEnabled(), true);
    assert.equal(canAttemptDeepLink(), true);
    if (prev === undefined) {
      delete process.env.NEXT_PUBLIC_ANDROID_LPA_DEEP_LINK;
    } else {
      process.env.NEXT_PUBLIC_ANDROID_LPA_DEEP_LINK = prev;
    }
  });
});
