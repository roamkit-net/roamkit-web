/**
 * Shared money display helpers for prepaid credits.
 * Prefer these over ad-hoc NumberFormat in components.
 *
 * Catalog UI must not import these — use `<CatalogPriceDisplay />` only.
 */

import type { CatalogPrice } from "@/types/billing";

/** Fallback when API token_symbol is empty — never show a bare amount. */
export const FALLBACK_CREDIT_SYMBOL = "credits";

const DEFAULT_CREDITS_FORMAT = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 6,
});

const MONEY_FORMAT = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function parseAmount(value: string | number): number | null {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

function creditsFormat(displayDecimals?: number): Intl.NumberFormat {
  if (displayDecimals == null) {
    return DEFAULT_CREDITS_FORMAT;
  }
  const digits = Math.max(0, Math.floor(displayDecimals));
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

/**
 * Format a credit / list amount as a numeric string.
 * When `displayDecimals` is set (from billing/config), both min and max
 * fraction digits use that precision; otherwise preserve up to 6 places.
 */
export function formatCredits(
  value: string | number,
  displayDecimals?: number,
): string {
  const n = parseAmount(value);
  if (n === null) {
    return String(value);
  }
  return creditsFormat(displayDecimals).format(n);
}

/**
 * Format a USDT amount for display.
 * Uses the same credit formatting; token symbol comes from BillingConfig.
 */
export function formatUsdt(
  value: string | number,
  tokenSymbol?: string,
): string {
  const formatted = formatCredits(value);
  if (tokenSymbol) {
    return `${formatted} ${tokenSymbol}`;
  }
  return formatted;
}

/** Format a USD money amount (orders / list prices — legacy; prefer catalog display). */
export function formatMoney(value: string | number): string {
  const n = parseAmount(value);
  if (n === null) {
    return String(value);
  }
  return MONEY_FORMAT.format(n);
}

export type FormattedCatalogPrice = {
  /** Formatted numeric string (no symbol), e.g. `12.50`. */
  value: string;
  /** Resolved symbol (`credits` when empty). */
  symbol: string;
  /** Full display string, e.g. `from 12.50 USDT` / `12.50 USDT`. */
  display: string;
  /**
   * Parsed amount for analytics (`price_numeric`).
   * Prefer this over parsing `display` later.
   */
  numeric: number | null;
};

function resolveCatalogSymbol(symbol: string): string {
  const trimmed = symbol.trim();
  if (trimmed) {
    return trimmed;
  }
  if (process.env.NODE_ENV !== "production") {
    console.warn(
      '[billing] Empty token_symbol; falling back to "credits" for catalog price display.',
    );
  }
  return FALLBACK_CREDIT_SYMBOL;
}

/**
 * Structured catalog price formatting for display + analytics.
 * Only `<CatalogPriceDisplay />` (and tests) should call this from UI code.
 */
export function formatCatalogPrice(
  price: CatalogPrice,
): FormattedCatalogPrice {
  const symbol = resolveCatalogSymbol(price.currency.symbol);
  const value = formatCredits(price.amount, price.currency.decimals);
  const numeric = parseAmount(price.amount);
  const withSymbol = `${value} ${symbol}`;
  const display = price.from ? `from ${withSymbol}` : withSymbol;
  return { value, symbol, display, numeric };
}
