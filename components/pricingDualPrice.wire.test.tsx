import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import {
  DisplayCurrencyContext,
  type DisplayCurrencyContextValue,
} from "@/components/billing/DisplayCurrencyProvider";
import { YOUR_PRICE_LABEL } from "@/components/CatalogPriceDisplay";
import { PackageRow } from "@/components/PackageRow";
import { PlanCard } from "@/components/PlanCard";
import type { Package } from "@/lib/api";
import type { DisplayCurrency } from "@/types/billing";

const usdt: DisplayCurrency = {
  symbol: "USDT",
  name: "USDT Credits",
  decimals: 2,
};

function currencyValue(): DisplayCurrencyContextValue {
  return {
    currency: usdt,
    config: {
      currency: usdt,
      configVersion: 1,
      billingEnabled: true,
      tokenDecimals: 6,
    },
    configVersion: 1,
    billingEnabled: true,
    isLoading: false,
    isFetching: false,
    error: null,
  };
}

function wrap(node: ReactNode): string {
  return renderToStaticMarkup(
    createElement(
      DisplayCurrencyContext.Provider,
      { value: currencyValue() },
      node,
    ),
  );
}

const discountedPlan: Package = {
  id: "discover-in-180days-10gb-px",
  title: "10GB / 180 Days",
  operator_title: "Airalo",
  country_code: "IN",
  data_allowance: "10 GB",
  validity_days: 180,
  price_usd: "54.15",
  list_price_usd: "57.00",
  discount_percent: "5.00",
  pricing_reason: "profile",
  is_unlimited: false,
  plan_type: "data",
  voice_minutes: null,
  text_sms: null,
};

const retailPlan: Package = {
  ...discountedPlan,
  price_usd: "57.00",
  list_price_usd: "57.00",
  discount_percent: "0.00",
  pricing_reason: "retail",
};

describe("PR5 dual-price wiring", () => {
  it("PlanCard shows dual price for discounted package", () => {
    const html = wrap(createElement(PlanCard, { plan: discountedPlan }));
    assert.match(html, /data-testid="catalog-price-dual"/);
    assert.match(html, /List price 57\.00 USDT/);
    assert.match(html, /Your price 54\.15 USDT/);
    assert.match(html, new RegExp(YOUR_PRICE_LABEL));
  });

  it("PlanCard stays single price when list equals charge", () => {
    const html = wrap(createElement(PlanCard, { plan: retailPlan }));
    assert.doesNotMatch(html, /data-testid="catalog-price-dual"/);
    assert.match(html, /aria-label="Price 57\.00 USDT"/);
    assert.doesNotMatch(html, new RegExp(YOUR_PRICE_LABEL));
  });

  it("PackageRow shows dual price for discounted package", () => {
    const html = wrap(createElement(PackageRow, { plan: discountedPlan }));
    assert.match(html, /data-testid="catalog-price-dual"/);
    assert.match(html, /Your price 54\.15 USDT/);
    assert.match(html, new RegExp(YOUR_PRICE_LABEL));
  });
});
