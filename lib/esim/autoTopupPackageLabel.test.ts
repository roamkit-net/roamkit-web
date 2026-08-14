import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  AUTO_TOPUP_FALLBACK_CURRENCY,
  autoTopupPackageOptionLabel,
} from "@/lib/esim/autoTopupPackageLabel";
import type { DisplayCurrency } from "@/types/billing";

const usdt: DisplayCurrency = {
  symbol: "USDT",
  name: "USDT Credits",
  decimals: 2,
};

const pkg = {
  title: "200 MB - 3 days",
  validity_days: 3,
  price_usd: "1.00",
};

describe("autoTopupPackageOptionLabel", () => {
  it("appends the discounted customer charge", () => {
    assert.equal(
      autoTopupPackageOptionLabel(pkg, usdt),
      "200 MB - 3 days · 3 days · 1.00 USDT",
    );
  });

  it("keeps the base label when price is empty, invalid, or negative", () => {
    const base = "200 MB - 3 days · 3 days";
    assert.equal(
      autoTopupPackageOptionLabel({ ...pkg, price_usd: "" }, usdt),
      base,
    );
    assert.equal(
      autoTopupPackageOptionLabel({ ...pkg, price_usd: "nope" }, usdt),
      base,
    );
    assert.equal(
      autoTopupPackageOptionLabel({ ...pkg, price_usd: "-1.00" }, usdt),
      base,
    );
  });

  it("ignores list_price_usd", () => {
    assert.equal(
      autoTopupPackageOptionLabel(
        { ...pkg, list_price_usd: "9.99" } as typeof pkg & {
          list_price_usd: string;
        },
        usdt,
      ),
      "200 MB - 3 days · 3 days · 1.00 USDT",
    );
  });

  it("uses the catalog fallback currency when config is missing", () => {
    assert.equal(
      autoTopupPackageOptionLabel(pkg),
      "200 MB - 3 days · 3 days · 1.00 credits",
    );
    assert.equal(AUTO_TOPUP_FALLBACK_CURRENCY.symbol, "credits");
    assert.equal(AUTO_TOPUP_FALLBACK_CURRENCY.decimals, 2);
  });
});
