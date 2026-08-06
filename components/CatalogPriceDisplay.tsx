"use client";

import { useContext } from "react";

import { DisplayCurrencyContext } from "@/components/billing/DisplayCurrencyProvider";
import {
  TokenIcon,
  type TokenIconSize,
} from "@/components/billing/TokenIcon";
import {
  FALLBACK_CREDIT_SYMBOL,
  formatCatalogPrice,
} from "@/lib/billing/format";
import type { CatalogPrice, DisplayCurrency } from "@/types/billing";

/** Fixed width for `99.99 USDT` — avoid flashing a bare amount then symbol. */
const SKELETON_CLASS =
  "inline-block h-[1.25em] min-w-[7.5rem] animate-pulse rounded bg-slate-200 align-middle";

/** Single-line reserve — retail and dual share trailing alignment (CLS). */
const PRICE_BLOCK_MIN_H_SINGLE = "min-h-[1.75rem]";
/** Two-line dual (strike + charge) without label padding. */
const PRICE_BLOCK_MIN_H_DUAL = "min-h-[2.25rem]";

/** Fixed icon ↔ amount gap (4px); not font-size dependent. */
const ICON_AMOUNT_GAP = "gap-1";

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

/**
 * Charge (and optional list strike) amount row.
 * Icon stays bound to the amount for RTL-friendly layout.
 */
function CatalogPriceContent({
  value,
  symbol,
  from,
  withIcon,
  iconSize = "sm",
}: {
  value: string;
  symbol: string;
  from?: boolean;
  withIcon: boolean;
  iconSize?: TokenIconSize;
}) {
  return (
    <span
      className={`inline-flex items-center ${ICON_AMOUNT_GAP} whitespace-nowrap`}
    >
      {from ? <span>from</span> : null}
      {withIcon ? <TokenIcon size={iconSize} /> : null}
      <span>
        {value} {symbol}
      </span>
    </span>
  );
}

type PriceBlockProps = {
  chargeValue: string;
  chargeSymbol: string;
  chargeDisplay: string;
  from?: boolean;
  withIcon: boolean;
  /** Dual charge uses TokenIcon `catalog` (20px) exclusively here. */
  chargeIconSize?: TokenIconSize;
  listValue?: string;
  listSymbol?: string;
  listDisplay?: string;
  testId?: string;
  dualTestId?: string;
  className?: string;
  title?: string;
  ariaLabel?: string;
};

/**
 * Unified layout: optional secondary strike, then dominant charge.
 * Dual and single share `items-end` trailing alignment.
 */
function PriceBlock({
  chargeValue,
  chargeSymbol,
  chargeDisplay,
  from,
  withIcon,
  chargeIconSize = "sm",
  listValue,
  listSymbol,
  listDisplay,
  testId = "catalog-price",
  dualTestId = "catalog-price-dual",
  className = "",
  title,
  ariaLabel,
}: PriceBlockProps) {
  const showStrike =
    listValue != null &&
    listSymbol != null &&
    listDisplay != null;

  if (showStrike) {
    return (
      <span
        data-testid={dualTestId}
        className={`inline-flex ${PRICE_BLOCK_MIN_H_DUAL} flex-col items-end justify-center gap-0.5 font-normal tabular-nums ${className}`.trim()}
        style={{ fontVariantNumeric: "tabular-nums" }}
        title={title}
      >
        <span
          className="text-sm font-normal text-slate-500 line-through"
          data-testid="catalog-price-list"
        >
          <span className="sr-only">{`List price ${listDisplay}`}</span>
          <span aria-hidden="true">
            <CatalogPriceContent
              value={listValue}
              symbol={listSymbol}
              withIcon={false}
            />
          </span>
        </span>
        <span data-testid={testId} className="font-bold">
          <span className="sr-only">{`Your price ${chargeDisplay}`}</span>
          <span aria-hidden="true">
            <CatalogPriceContent
              value={chargeValue}
              symbol={chargeSymbol}
              from={from}
              withIcon={withIcon}
              iconSize={chargeIconSize}
            />
          </span>
        </span>
      </span>
    );
  }

  return (
    <span
      data-testid={testId}
      className={`inline-flex ${PRICE_BLOCK_MIN_H_SINGLE} items-center tabular-nums ${className}`.trim()}
      style={{ fontVariantNumeric: "tabular-nums" }}
      title={title}
      aria-label={ariaLabel ?? `Price ${chargeDisplay}`}
    >
      <CatalogPriceContent
        value={chargeValue}
        symbol={chargeSymbol}
        from={from}
        withIcon={withIcon}
        iconSize={chargeIconSize}
      />
    </span>
  );
}

/** Compare API money strings without computing a discount. */
function amountsDiffer(customer: string, list: string): boolean {
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
        className={`${SKELETON_CLASS} ${PRICE_BLOCK_MIN_H_SINGLE} ${className}`.trim()}
        aria-hidden="true"
      />
    );
  }

  // list without customer charge → do not render broken dual UI
  if (!hasAmount && !resolvedFromContext && hasList) {
    return (
      <span
        data-testid="catalog-price-skeleton"
        className={`${SKELETON_CLASS} ${PRICE_BLOCK_MIN_H_SINGLE} ${className}`.trim()}
        aria-hidden="true"
      />
    );
  }

  const showDual =
    hasAmount && hasList && amountsDiffer(amount!, String(listAmount));

  if (resolvedFromContext) {
    const chargeFormatted = formatCatalogPrice(resolvedFromContext);
    const withIcon = chargeFormatted.symbol !== FALLBACK_CREDIT_SYMBOL;
    if (showDual) {
      const listFormatted = formatCatalogPrice(
        resolveCatalogPrice(
          String(listAmount),
          resolvedFromContext.currency,
          false,
        ),
      );
      return (
        <PriceBlock
          chargeValue={chargeFormatted.value}
          chargeSymbol={chargeFormatted.symbol}
          chargeDisplay={chargeFormatted.display}
          from={resolvedFromContext.from}
          withIcon={withIcon}
          chargeIconSize="catalog"
          listValue={listFormatted.value}
          listSymbol={listFormatted.symbol}
          listDisplay={listFormatted.display}
          className={className}
        />
      );
    }
    return (
      <PriceBlock
        chargeValue={chargeFormatted.value}
        chargeSymbol={chargeFormatted.symbol}
        chargeDisplay={chargeFormatted.display}
        from={resolvedFromContext.from}
        withIcon={withIcon}
        className={className}
      />
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
        <PriceBlock
          chargeValue={formatted.value}
          chargeSymbol={formatted.symbol}
          chargeDisplay={formatted.display}
          from={from}
          withIcon={false}
          listValue={listFormatted.value}
          listSymbol={listFormatted.symbol}
          listDisplay={listFormatted.display}
          testId="catalog-price-degraded"
          dualTestId="catalog-price-dual-degraded"
          className={className}
          title={CURRENCY_UNAVAILABLE_TITLE}
        />
      );
    }
    return (
      <PriceBlock
        chargeValue={formatted.value}
        chargeSymbol={formatted.symbol}
        chargeDisplay={formatted.display}
        from={from}
        withIcon={false}
        testId="catalog-price-degraded"
        className={className}
        title={CURRENCY_UNAVAILABLE_TITLE}
        ariaLabel={`Price ${formatted.display}. ${CURRENCY_UNAVAILABLE_TITLE}`}
      />
    );
  }

  return (
    <span
      data-testid="catalog-price-skeleton"
      className={`${SKELETON_CLASS} ${PRICE_BLOCK_MIN_H_SINGLE} ${className}`.trim()}
      aria-hidden="true"
    />
  );
}
