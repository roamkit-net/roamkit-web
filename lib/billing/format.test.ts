import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";

import {
  FALLBACK_CREDIT_SYMBOL,
  formatCatalogPrice,
  formatCredits,
  formatMoney,
  formatUsdt,
} from "./format";
import type { CatalogPrice, DisplayCurrency } from "@/types/billing";

const usdt: DisplayCurrency = {
  symbol: "USDT",
  name: "USDT Credits",
  decimals: 2,
};

const credits: DisplayCurrency = {
  symbol: "",
  name: "Credits",
  decimals: 2,
};

const testToken: DisplayCurrency = {
  symbol: "TEST",
  name: "Test Credits",
  decimals: 2,
};

function price(
  amount: string,
  currency: DisplayCurrency,
  from?: boolean,
): CatalogPrice {
  return { amount, currency, from };
}

describe("formatCredits", () => {
  it("formats with at least two fraction digits by default", () => {
    assert.equal(formatCredits("15.5"), "15.50");
    assert.equal(formatCredits(0), "0.00");
  });

  it("preserves up to six fraction digits by default", () => {
    assert.equal(formatCredits("1.123456"), "1.123456");
  });

  it("honors display_decimals when provided", () => {
    assert.equal(formatCredits("12.5", 2), "12.50");
    assert.equal(formatCredits("12.567", 2), "12.57");
    assert.equal(formatCredits("1.123456", 2), "1.12");
    assert.equal(formatCredits("1.1", 4), "1.1000");
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

describe("formatCatalogPrice", () => {
  const amounts = ["0.50", "4.50", "99.99", "12345.50"] as const;
  const originalWarn = console.warn;

  afterEach(() => {
    console.warn = originalWarn;
  });

  for (const amount of amounts) {
    const expectedValue = formatCredits(amount, 2);

    it(`formats ${amount} USDT`, () => {
      const result = formatCatalogPrice(price(amount, usdt));
      assert.equal(result.value, expectedValue);
      assert.equal(result.symbol, "USDT");
      assert.equal(result.display, `${expectedValue} USDT`);
      assert.equal(result.numeric, Number(amount));
    });

    it(`formats ${amount} TEST`, () => {
      const result = formatCatalogPrice(price(amount, testToken));
      assert.equal(result.display, `${expectedValue} TEST`);
      assert.equal(result.symbol, "TEST");
    });

    it(`formats ${amount} with empty symbol → credits`, () => {
      console.warn = () => undefined;
      const result = formatCatalogPrice(price(amount, credits));
      assert.equal(result.symbol, FALLBACK_CREDIT_SYMBOL);
      assert.equal(
        result.display,
        `${expectedValue} ${FALLBACK_CREDIT_SYMBOL}`,
      );
    });
  }

  it("prefixes from when requested", () => {
    const result = formatCatalogPrice(price("12.50", usdt, true));
    assert.equal(result.display, "from 12.50 USDT");
    assert.equal(result.value, "12.50");
    assert.equal(result.numeric, 12.5);
  });

  it("honors display_decimals from currency", () => {
    const currency: DisplayCurrency = {
      symbol: "USDT",
      name: "USDT Credits",
      decimals: 3,
    };
    const result = formatCatalogPrice(price("4.5", currency));
    assert.equal(result.value, "4.500");
    assert.equal(result.display, "4.500 USDT");
  });

  it("keeps numeric null for non-finite amounts", () => {
    const result = formatCatalogPrice(price("n/a", usdt));
    assert.equal(result.value, "n/a");
    assert.equal(result.numeric, null);
    assert.equal(result.display, "n/a USDT");
  });
});

describe("formatCatalogPrice empty symbol warn", () => {
  const originalEnv = process.env.NODE_ENV;
  const warnings: unknown[][] = [];
  const originalWarn = console.warn;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
    console.warn = originalWarn;
    warnings.length = 0;
  });

  it("warns in non-production when symbol is empty", () => {
    process.env.NODE_ENV = "development";
    console.warn = (...args: unknown[]) => {
      warnings.push(args);
    };
    formatCatalogPrice(price("1.00", credits));
    assert.equal(warnings.length, 1);
    assert.match(String(warnings[0]?.[0]), /credits/i);
  });
});
