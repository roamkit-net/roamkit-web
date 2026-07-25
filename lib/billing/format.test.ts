import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { formatCredits, formatMoney, formatUsdt } from "./format";

describe("formatCredits", () => {
  it("formats with at least two fraction digits", () => {
    assert.equal(formatCredits("15.5"), "15.50");
    assert.equal(formatCredits(0), "0.00");
  });

  it("preserves up to six fraction digits", () => {
    assert.equal(formatCredits("1.123456"), "1.123456");
  });

  it("returns the original string when not finite", () => {
    assert.equal(formatCredits("n/a"), "n/a");
  });
});

describe("formatUsdt", () => {
  it("optionally appends a token symbol from config", () => {
    assert.equal(formatUsdt("10", "TEST"), "10.00 TEST");
    assert.equal(formatUsdt("10"), "10.00");
  });
});

describe("formatMoney", () => {
  it("formats USD with two decimals", () => {
    assert.equal(formatMoney("9.5"), "$9.50");
  });
});
