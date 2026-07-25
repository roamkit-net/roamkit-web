import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { returnDestinationLabel } from "@/lib/billing/returnLabel";

describe("returnDestinationLabel", () => {
  it("labels plans store", () => {
    assert.equal(returnDestinationLabel("/plans"), "browse plans");
    assert.equal(returnDestinationLabel("/plans?tab=local"), "browse plans");
  });

  it("labels eSIM top-up detail", () => {
    assert.equal(
      returnDestinationLabel("/me/esims/abc-123"),
      "finish your top-up",
    );
  });

  it("labels My eSIMs list", () => {
    assert.equal(returnDestinationLabel("/me/esims"), "My eSIMs");
  });

  it("labels location checkout", () => {
    assert.equal(returnDestinationLabel("/croatia"), "finish your purchase");
  });

  it("falls back for unknown paths", () => {
    assert.equal(
      returnDestinationLabel("/me/something-else"),
      "continue where you left off",
    );
  });
});
