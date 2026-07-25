import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  amountToBaseUnits,
  eip681UriWithAmount,
  isValidDepositAmount,
} from "./eip681";

describe("amountToBaseUnits", () => {
  it("converts whole USDT amounts", () => {
    assert.equal(amountToBaseUnits("50", 6), "50000000");
  });

  it("pads fractional digits to token decimals", () => {
    assert.equal(amountToBaseUnits("15.5", 6), "15500000");
  });

  it("rejects more fractional digits than decimals", () => {
    assert.equal(amountToBaseUnits("1.1234567", 6), null);
  });

  it("rejects zero", () => {
    assert.equal(amountToBaseUnits("0", 6), null);
    assert.equal(amountToBaseUnits("0.000000", 6), null);
  });
});

describe("eip681UriWithAmount", () => {
  const base =
    "ethereum:0xc2132D05D31c914a87C6611C10748AEb04B58e8F@137/transfer?address=0xabc";

  it("appends uint256 for a known amount", () => {
    assert.equal(
      eip681UriWithAmount(base, "10", 6),
      `${base}&uint256=10000000`,
    );
  });

  it("replaces an existing uint256", () => {
    assert.equal(
      eip681UriWithAmount(`${base}&uint256=1`, "2", 6),
      `${base}&uint256=2000000`,
    );
  });

  it("returns the base URI when amount is invalid", () => {
    assert.equal(eip681UriWithAmount(base, "0", 6), base);
  });
});

describe("isValidDepositAmount", () => {
  it("accepts positive amounts within precision", () => {
    assert.equal(isValidDepositAmount("0.000001"), true);
    assert.equal(isValidDepositAmount("100.5"), true);
  });

  it("rejects empty, zero, and over-precision values", () => {
    assert.equal(isValidDepositAmount(""), false);
    assert.equal(isValidDepositAmount("0"), false);
    assert.equal(isValidDepositAmount("1.1234567"), false);
  });
});
