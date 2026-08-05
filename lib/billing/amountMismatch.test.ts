import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { ApiError } from "@/lib/api";

import { parseAmountMismatch } from "./amountMismatch";

describe("parseAmountMismatch", () => {
  it("reads structured AMOUNT_MISMATCH fields", () => {
    const error = new ApiError("Request failed: 400", 400, {
      code: "AMOUNT_MISMATCH",
      on_chain_amount: "24.990000",
      amount_requested: "25.000000",
      failure_reason:
        "Amount mismatch: on-chain 24.990000 != requested 25.000000",
      status: "failed",
    });
    assert.deepEqual(parseAmountMismatch(error), {
      onChainAmount: "24.99",
      requestedAmount: "25",
    });
  });

  it("falls back to failure_reason text", () => {
    const error = new ApiError("Request failed: 400", 400, {
      status: "failed",
      failure_reason:
        "Amount mismatch: on-chain 9.000000 != requested 10.000000",
    });
    assert.deepEqual(parseAmountMismatch(error), {
      onChainAmount: "9",
      requestedAmount: "10",
    });
  });

  it("returns null when not a mismatch", () => {
    assert.equal(
      parseAmountMismatch(new ApiError("bad", 400, { detail: "Invalid tx" })),
      null,
    );
  });
});
