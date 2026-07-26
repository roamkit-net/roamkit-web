import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { hasSufficientCredits } from "./canAfford";

describe("hasSufficientCredits", () => {
  it("returns null when balance is unknown", () => {
    assert.equal(hasSufficientCredits(null, "4.50"), null);
    assert.equal(hasSufficientCredits(undefined, "4.50"), null);
    assert.equal(hasSufficientCredits("", "4.50"), null);
  });

  it("returns true when balance covers price", () => {
    assert.equal(hasSufficientCredits("4.50", "4.50"), true);
    assert.equal(hasSufficientCredits("10.000000", "4.50"), true);
  });

  it("returns false when balance is short", () => {
    assert.equal(hasSufficientCredits("1.00", "4.50"), false);
    assert.equal(hasSufficientCredits("0", "0.01"), false);
  });

  it("returns null for unparseable amounts", () => {
    assert.equal(hasSufficientCredits("abc", "4.50"), null);
    assert.equal(hasSufficientCredits("10", "n/a"), null);
  });
});
