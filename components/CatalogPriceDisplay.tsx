"use client";

import { useContext } from "react";

import { DisplayCurrencyContext } from "@/components/billing/DisplayCurrencyProvider";
import { TokenIcon } from "@/components/billing/TokenIcon";
import {
  FALLBACK_CREDIT_SYMBOL,
  formatCatalogPrice,
} from "@/lib/billing/format";
import type { CatalogPrice, DisplayCurrency } from "@/types/billing";

/** Locked customer-price label (PR5). Do not invent synonyms. */
export const YOUR_PRICE_LABEL = "Vaša cijena";

/** Fixed width for `99.99 USDT` — avoid flashing a bare amount then symbol. */
const SKELETON_CLASS =
  "inline-block h-[1.25em] min-w-[7.5rem] animate-pulse rounded bg-slate-200 align-middle";

/** Reserve dual-line height so retail ↔ discount does not shift card layout (CLS). */
const PRICE_BLOCK_MIN_H = "min-h-[2.75rem]";

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
   * Customer charge amount; currency comes from DisplayCurrencyProvider
   * when `price` is omitted.
   */
  amount?: string | null;
  /**
   * Provider list amount from API (`list_price_usd`). Render-only — never
   * derive charge from list. Dual UI only when both amounts present and differ.
   */
  listAmount?: string | null;
  /** Prefix display with `from` (location cards). */
  from?: boolean;
  /** Force skeleton (e.g. while a parent is still loading). */
  loading?: boolean;
  className?: string;
};

function CatalogPriceContent({
  value,
  symbol,
  from,
  withIcon,
}: {
  value: string;
  symbol: string;
  from?: boolean;
  withIcon: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-1 whitespace-nowrap">
      {from ? <span>from</span> : null}
      {withIcon ? <TokenIcon size="sm" /> : null}
      <span>
        {value} {symbol}
      </span>
    </span>
  );
}

/** Compare API money strings without computing a discount. */
function amountsDiffer(
  customer: string,
  list: string,
): boolean {
  const a = Number(customer);
  const b = Number(list);
  if (Number.isFinite(a) && Number.isFinite(b)) {
    return a !== b;
  }
  return customer.trim() !== list.trim();
}

function resolveCatalogPrice(
  amount: string,
  currency: DisplayCurrency,
  from: boolean,
): CatalogPrice {
  return { amount, currency, from };
}

/**
 * Sole catalog UI entry for prepaid credit prices.
 * Catalog components must not call formatCredits / formatMoney / formatCatalogPrice.
 *
 * Render-only: never computes discount from list / percent.
 * DisplayCurrencyProvider is optional — without it (or on config error),
 * amounts render as degraded `{amount} credits` (never an infinite skeleton).
 */
export function CatalogPriceDisplay({
  price,
  amount,
  listAmount = null,
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
  const hasList =
    listAmount != null && String(listAmount).trim() !== "";
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
        className={`${SKELETON_CLASS} ${PRICE_BLOCK_MIN_H} ${className}`.trim()}
        aria-hidden="true"
      />
    );
  }

  // list without customer charge → do not render broken dual UI
  if (!hasAmount && !resolvedFromContext && hasList) {
    return (
      <span
        data-testid="catalog-price-skeleton"
        className={`${SKELETON_CLASS} ${PRICE_BLOCK_MIN_H} ${className}`.trim()}
        aria-hidden="true"
      />
    );
  }

  const showDual =
    hasAmount &&
    hasList &&
    amountsDiffer(amount!, String(listAmount));

  if (resolvedFromContext && showDual) {
    const currency = resolvedFromContext.currency;
    const chargeFormatted = formatCatalogPrice(resolvedFromContext);
    const listFormatted = formatCatalogPrice(
      resolveCatalogPrice(String(listAmount), currency, false),
    );
    const withIcon = chargeFormatted.symbol !== FALLBACK_CREDIT_SYMBOL;
    return (
      <span
        data-testid="catalog-price-dual"
        className={`inline-flex ${PRICE_BLOCK_MIN_H} flex-col items-end justify-center gap-0.5 font-normal tabular-nums ${className}`.trim()}
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        <span
          className="text-sm font-normal text-slate-500 line-through"
          data-testid="catalog-price-list"
        >
          <span className="sr-only">
            {`List price ${listFormatted.display}`}
          </span>
          <span aria-hidden="true">
            <CatalogPriceContent
              value={listFormatted.value}
              symbol={listFormatted.symbol}
              withIcon={false}
            />
          </span>
        </span>
        <span data-testid="catalog-price" className="font-bold">
          <span className="sr-only">
            {`Your price ${chargeFormatted.display}`}
          </span>
          <span aria-hidden="true" className="inline-flex flex-col items-end">
            <CatalogPriceContent
              value={chargeFormatted.value}
              symbol={chargeFormatted.symbol}
              from={resolvedFromContext.from}
              withIcon={withIcon}
            />
            <span className="text-xs font-medium text-slate-600">
              {YOUR_PRICE_LABEL}
            </span>
          </span>
        </span>
      </span>
    );
  }

  if (resolvedFromContext) {
    const formatted = formatCatalogPrice(resolvedFromContext);
    const withIcon = formatted.symbol !== FALLBACK_CREDIT_SYMBOL;
    return (
      <span
        data-testid="catalog-price"
        className={`inline-flex ${PRICE_BLOCK_MIN_H} items-center tabular-nums ${className}`.trim()}
        style={{ fontVariantNumeric: "tabular-nums" }}
        aria-label={`Price ${formatted.display}`}
      >
        <CatalogPriceContent
          value={formatted.value}
          symbol={formatted.symbol}
          from={resolvedFromContext.from}
          withIcon={withIcon}
        />
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
    const showDualDegraded =
      hasList && amountsDiffer(amount!, String(listAmount));
    if (showDualDegraded) {
      const listFormatted = formatCatalogPrice(
        resolveCatalogPrice(String(listAmount), FALLBACK_CURRENCY, false),
      );
      return (
        <span
          data-testid="catalog-price-dual-degraded"
          className={`inline-flex ${PRICE_BLOCK_MIN_H} flex-col items-end justify-center gap-0.5 tabular-nums ${className}`.trim()}
          style={{ fontVariantNumeric: "tabular-nums" }}
          title={CURRENCY_UNAVAILABLE_TITLE}
        >
          <span
            className="text-sm font-normal text-slate-500 line-through"
            data-testid="catalog-price-list"
          >
            <span className="sr-only">
              {`List price ${listFormatted.display}`}
            </span>
            <span aria-hidden="true">
              <CatalogPriceContent
                value={listFormatted.value}
                symbol={listFormatted.symbol}
                withIcon={false}
              />
            </span>
          </span>
          <span data-testid="catalog-price-degraded">
            <span className="sr-only">
              {`Your price ${formatted.display}. ${CURRENCY_UNAVAILABLE_TITLE}`}
            </span>
            <span aria-hidden="true" className="inline-flex flex-col items-end">
              <CatalogPriceContent
                value={formatted.value}
                symbol={formatted.symbol}
                from={from}
                withIcon={false}
              />
              <span className="text-xs font-medium text-slate-600">
                {YOUR_PRICE_LABEL}
              </span>
            </span>
          </span>
        </span>
      );
    }
    return (
      <span
        data-testid="catalog-price-degraded"
        className={`inline-flex ${PRICE_BLOCK_MIN_H} items-center tabular-nums ${className}`.trim()}
        style={{ fontVariantNumeric: "tabular-nums" }}
        title={CURRENCY_UNAVAILABLE_TITLE}
        aria-label={`Price ${formatted.display}. ${CURRENCY_UNAVAILABLE_TITLE}`}
      >
        <CatalogPriceContent
          value={formatted.value}
          symbol={formatted.symbol}
          from={from}
          withIcon={false}
        />
      </span>
    );
  }

  return (
    <span
      data-testid="catalog-price-skeleton"
      className={`${SKELETON_CLASS} ${PRICE_BLOCK_MIN_H} ${className}`.trim()}
      aria-hidden="true"
    />
  );
}
