import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { ApiError } from "@/lib/api";

import {
  buildDepositRedirectUrl,
  computeMissingCredits,
  isInsufficientCreditsError,
  normalizeDepositAmount,
  parseInsufficientCredits,
  shortfallCtaLabel,
} from "./insufficientCredits";

describe("normalizeDepositAmount", () => {
  it("trims trailing fractional zeros", () => {
    assert.equal(normalizeDepositAmount("11.500000"), "11.5");
    assert.equal(normalizeDepositAmount("10.000000"), "10");
    assert.equal(normalizeDepositAmount("0.250000"), "0.25");
  });
});

describe("computeMissingCredits", () => {
  it("returns normalized shortfall", () => {
    assert.equal(computeMissingCredits("1.00", "4.50"), "3.5");
    assert.equal(computeMissingCredits("0", "11.500000"), "11.5");
  });

  it("returns null when balance covers or exceeds price", () => {
    assert.equal(computeMissingCredits("4.50", "4.50"), null);
    assert.equal(computeMissingCredits("10", "4.50"), null);
  });

  it("returns null for unparseable amounts", () => {
    assert.equal(computeMissingCredits("abc", "4.50"), null);
    assert.equal(computeMissingCredits("10", "n/a"), null);
  });
});

describe("shortfallCtaLabel", () => {
  it("uses Add credits when balance is zero", () => {
    assert.equal(
      shortfallCtaLabel({
        missing: "4.50",
        balance: "0",
        tokenSymbol: "USDT",
      }),
      "Add credits",
    );
    assert.equal(
      shortfallCtaLabel({
        missing: "4.50",
        balance: "0.00",
        tokenSymbol: "USDT",
      }),
      "Add credits",
    );
  });

  it("shows missing amount when balance is partial", () => {
    assert.equal(
      shortfallCtaLabel({
        missing: "3.5",
        balance: "1.00",
        tokenSymbol: "USDT",
      }),
      "Add 3.50 USDT",
    );
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
