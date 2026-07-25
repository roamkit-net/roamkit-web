"use client";

import { useContext } from "react";

import { DisplayCurrencyContext } from "@/components/billing/DisplayCurrencyProvider";
import { formatCatalogPrice } from "@/lib/billing/format";
import type { CatalogPrice } from "@/types/billing";

/** Fixed width for `99.99 USDT` — avoid flashing a bare amount then symbol. */
const SKELETON_CLASS =
  "inline-block h-[1.25em] min-w-[7.5rem] animate-pulse rounded bg-slate-200 align-middle";

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
 */
export function CatalogPriceDisplay({
  price,
  amount,
  from = false,
  loading = false,
  className = "",
}: CatalogPriceDisplayProps) {
  const ctx = useContext(DisplayCurrencyContext);

  const resolved: CatalogPrice | null =
    price ??
    (amount != null && amount !== "" && ctx?.currency
      ? { amount, currency: ctx.currency, from }
      : null);

  const awaitingCurrency =
    price == null &&
    amount != null &&
    amount !== "" &&
    (ctx == null || ctx.isLoading || ctx.currency == null);

  if (loading || !resolved || awaitingCurrency) {
    return (
      <span
        data-testid="catalog-price-skeleton"
        className={`${SKELETON_CLASS} ${className}`.trim()}
        aria-hidden="true"
      />
    );
  }

  const formatted = formatCatalogPrice(resolved);

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
