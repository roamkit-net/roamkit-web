import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import {
  DisplayCurrencyContext,
  type DisplayCurrencyContextValue,
} from "@/components/billing/DisplayCurrencyProvider";
import { CatalogPriceDisplay } from "./CatalogPriceDisplay";
import type { CatalogPrice, DisplayCurrency } from "@/types/billing";

const usdt: DisplayCurrency = {
  symbol: "USDT",
  name: "USDT Credits",
  decimals: 2,
};

const emptySymbol: DisplayCurrency = {
  symbol: "",
  name: "Credits",
  decimals: 2,
};

function displayCurrencyValue(
  overrides: Partial<DisplayCurrencyContextValue> = {},
): DisplayCurrencyContextValue {
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
    ...overrides,
  };
}

function render(props: Parameters<typeof CatalogPriceDisplay>[0]): string {
  return renderToStaticMarkup(createElement(CatalogPriceDisplay, props));
}

function renderWithCurrency(
  props: Parameters<typeof CatalogPriceDisplay>[0],
  value: DisplayCurrencyContextValue,
): string {
  return renderToStaticMarkup(
    createElement(
      DisplayCurrencyContext.Provider,
      { value },
      createElement(CatalogPriceDisplay, props) as ReactNode,
    ),
  );
}

describe("CatalogPriceDisplay", () => {
  it("renders loading skeleton sized for a credit price", () => {
    const html = render({ loading: true });
    assert.match(html, /data-testid="catalog-price-skeleton"/);
    assert.match(html, /min-w-\[7\.5rem\]/);
    assert.match(html, /animate-pulse/);
    assert.doesNotMatch(html, /\$/);
    assert.doesNotMatch(html, /\bUSD\b/);
  });

  it("renders skeleton when price is missing", () => {
    const html = render({});
    assert.match(html, /data-testid="catalog-price-skeleton"/);
  });

  it("renders skeleton for amount while currency is loading", () => {
    const html = renderWithCurrency(
      { amount: "4.50" },
      displayCurrencyValue({ currency: null, config: null, isLoading: true }),
    );
    assert.match(html, /data-testid="catalog-price-skeleton"/);
  });

  it("architecture: without DisplayCurrencyProvider renders fallback, not skeleton", () => {
    const html = render({ amount: "19.50" });
    assert.doesNotMatch(html, /data-testid="catalog-price-skeleton"/);
    assert.match(html, /data-testid="catalog-price-degraded"/);
    assert.match(html, /19\.50 credits/);
    assert.match(html, /Currency configuration unavailable/);
  });

  it("renders degraded credits when config errored and currency missing", () => {
    const html = renderWithCurrency(
      { amount: "8.00" },
      displayCurrencyValue({
        currency: null,
        config: null,
        isLoading: false,
        error: new Error("Request failed: 404"),
      }),
    );
    assert.doesNotMatch(html, /data-testid="catalog-price-skeleton"/);
    assert.match(html, /data-testid="catalog-price-degraded"/);
    assert.match(html, /8\.00 credits/);
  });

  it("resolves amount from DisplayCurrency context", () => {
    const html = renderWithCurrency(
      { amount: "12.50" },
      displayCurrencyValue(),
    );
    assert.match(html, /aria-label="Price 12\.50 USDT"/);
    assert.match(html, />12\.50 USDT</);
  });

  it("resolves amount with from prefix from context", () => {
    const html = renderWithCurrency(
      { amount: "4.50", from: true },
      displayCurrencyValue(),
    );
    assert.match(html, /aria-label="Price from 4\.50 USDT"/);
    assert.match(html, />from 4\.50 USDT</);
  });

  it("renders amount with symbol and tabular-nums", () => {
    const price: CatalogPrice = {
      amount: "12.50",
      currency: usdt,
    };
    const html = render({ price });
    assert.match(html, /data-testid="catalog-price"/);
    assert.match(html, /tabular-nums/);
    assert.match(html, /font-variant-numeric:tabular-nums/);
    assert.match(html, /aria-label="Price 12\.50 USDT"/);
    assert.match(html, />12\.50 USDT</);
    assert.doesNotMatch(html, /\$/);
    assert.doesNotMatch(html, /\bUSD\b/);
  });

  it("renders from prefix", () => {
    const price: CatalogPrice = {
      amount: "4.50",
      currency: usdt,
      from: true,
    };
    const html = render({ price });
    assert.match(html, /aria-label="Price from 4\.50 USDT"/);
    assert.match(html, />from 4\.50 USDT</);
  });

  it("falls back to credits when symbol is empty", () => {
    const price: CatalogPrice = {
      amount: "99.99",
      currency: emptySymbol,
    };
    const originalWarn = console.warn;
    console.warn = () => undefined;
    try {
      const html = render({ price });
      assert.match(html, /aria-label="Price 99\.99 credits"/);
      assert.match(html, />99\.99 credits</);
    } finally {
      console.warn = originalWarn;
    }
  });
});
