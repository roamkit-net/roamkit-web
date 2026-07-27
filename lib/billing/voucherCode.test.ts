import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  extractCodeFromScan,
  isValidClientVoucherCode,
  normalizeVoucherCode,
  sanitizeClipboardText,
} from "./voucherCode";

describe("normalizeVoucherCode", () => {
  it("trims, uppercases, and strips whitespace", () => {
    assert.equal(normalizeVoucherCode("  rk-ab cd  "), "RK-ABCD");
  });
});

describe("isValidClientVoucherCode", () => {
  it("rejects empty and overlong", () => {
    assert.equal(isValidClientVoucherCode("   "), false);
    assert.equal(isValidClientVoucherCode("x".repeat(65)), false);
    assert.equal(isValidClientVoucherCode("RK-OK"), true);
  });
});

describe("extractCodeFromScan", () => {
  it("reads plain codes and ?code= from URLs", () => {
    assert.equal(extractCodeFromScan("rk-xyz"), "RK-XYZ");
    assert.equal(
      extractCodeFromScan("https://staging.roamkit.net/me/deposit?code=rk-1"),
      "RK-1",
    );
  });
});

describe("sanitizeClipboardText", () => {
  it("strips newlines then normalizes", () => {
    assert.equal(sanitizeClipboardText("rk-\nabc\n"), "RK-ABC");
  });
});
