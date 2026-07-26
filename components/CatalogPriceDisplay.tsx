"use client";

import { useContext } from "react";

import { DisplayCurrencyContext } from "@/components/billing/DisplayCurrencyProvider";
import {
  FALLBACK_CREDIT_SYMBOL,
  formatCatalogPrice,
} from "@/lib/billing/format";
import type { CatalogPrice, DisplayCurrency } from "@/types/billing";

/** Fixed width for `99.99 USDT` — avoid flashing a bare amount then symbol. */
const SKELETON_CLASS =
  "inline-block h-[1.25em] min-w-[7.5rem] animate-pulse rounded bg-slate-200 align-middle";

const FALLBACK_CURRENCY: DisplayCurrency = {
  symbol: FALLBACK_CREDIT_SYMBOL,
  name: "Credits",
  decimals: 2,
};

export const CURRENCY_UNAVAILABLE_TITLE =
  "Currency configuration unavailable";

export type CatalogPriceDisplayProps = {
  /** Structured price (tests / explicit currency). Takes precedence over `amount`. */
  price?: CatalogPrice | null;
  /**
   * List / top-up amount; currency comes from DisplayCurrencyProvider
   * when `price` is omitted.
   */
  amount?: string | null;
  /** Prefix display with `from` (location cards). */
  from?: boolean;
  /** Force skeleton (e.g. while a parent is still loading). */
  loading?: boolean;
  className?: string;
};

/**
 * Sole catalog UI entry for prepaid credit prices.
 * Catalog components must not call formatCredits / formatMoney / formatCatalogPrice.
 *
 * DisplayCurrencyProvider is optional — without it (or on config error),
 * amounts render as degraded `{amount} credits` (never an infinite skeleton).
 */
export function CatalogPriceDisplay({
  price,
  amount,
  from = false,
  loading = false,
  className = "",
}: CatalogPriceDisplayProps) {
  const ctx = useContext(DisplayCurrencyContext);

  const resolvedFromContext: CatalogPrice | null =
    price ??
    (amount != null && amount !== "" && ctx?.currency
      ? { amount, currency: ctx.currency, from }
      : null);

  const hasAmount = amount != null && amount !== "";
  const awaitingCurrency =
    price == null &&
    hasAmount &&
    ctx != null &&
    ctx.isLoading &&
    ctx.currency == null &&
    ctx.error == null;

  if (loading || awaitingCurrency) {
    return (
      <span
        data-testid="catalog-price-skeleton"
        className={`${SKELETON_CLASS} ${className}`.trim()}
        aria-hidden="true"
      />
    );
  }

  if (resolvedFromContext) {
    const formatted = formatCatalogPrice(resolvedFromContext);
    return (
      <span
        data-testid="catalog-price"
        className={`tabular-nums ${className}`.trim()}
        style={{ fontVariantNumeric: "tabular-nums" }}
        aria-label={`Price ${formatted.display}`}
      >
        {formatted.display}
      </span>
    );
  }

  if (hasAmount) {
    const degraded: CatalogPrice = {
      amount: amount!,
      currency: FALLBACK_CURRENCY,
      from,
    };
    const formatted = formatCatalogPrice(degraded);
    return (
      <span
        data-testid="catalog-price-degraded"
        className={`tabular-nums ${className}`.trim()}
        style={{ fontVariantNumeric: "tabular-nums" }}
        title={CURRENCY_UNAVAILABLE_TITLE}
        aria-label={`Price ${formatted.display}. ${CURRENCY_UNAVAILABLE_TITLE}`}
      >
        {formatted.display}
      </span>
    );
  }

  return (
    <span
      data-testid="catalog-price-skeleton"
      className={`${SKELETON_CLASS} ${className}`.trim()}
      aria-hidden="true"
    />
  );
}
