import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { ApiError } from "@/lib/api";

import {
  buildDepositRedirectUrl,
  isInsufficientCreditsError,
  normalizeDepositAmount,
  parseInsufficientCredits,
} from "./insufficientCredits";

describe("normalizeDepositAmount", () => {
  it("trims trailing fractional zeros", () => {
    assert.equal(normalizeDepositAmount("11.500000"), "11.5");
    assert.equal(normalizeDepositAmount("10.000000"), "10");
    assert.equal(normalizeDepositAmount("0.250000"), "0.25");
  });
});

describe("buildDepositRedirectUrl", () => {
  it("builds amount and return query params", () => {
    assert.equal(
      buildDepositRedirectUrl({
        amount: "11.500000",
        returnPath: "/croatia-esim",
      }),
      "/me/deposit?amount=11.5&return=%2Fcroatia-esim",
    );
  });

  it("drops unsafe return paths", () => {
    assert.equal(
      buildDepositRedirectUrl({
        amount: "5",
        returnPath: "https://evil.example",
      }),
      "/me/deposit?amount=5",
    );
  });
});

describe("insufficient credits parsing", () => {
  it("parses structured 402 bodies", () => {
    const error = new ApiError("Payment required", 402, {
      code: "INSUFFICIENT_CREDITS",
      detail: "Insufficient funds",
      required: "11.500000",
      balance: "0.000000",
      missing: "11.500000",
    });
    assert.equal(isInsufficientCreditsError(error), true);
    assert.deepEqual(parseInsufficientCredits(error), {
      code: "INSUFFICIENT_CREDITS",
      detail: "Insufficient funds",
      required: "11.500000",
      balance: "0.000000",
      missing: "11.500000",
    });
  });

  it("rejects non-402 errors", () => {
    const error = new ApiError("nope", 400, { code: "INSUFFICIENT_CREDITS" });
    assert.equal(isInsufficientCreditsError(error), false);
    assert.equal(parseInsufficientCredits(error), null);
  });
});
