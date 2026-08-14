/** Plain-text Package <option> labels (native select cannot render CatalogPriceDisplay). */

import type { TopupPackage } from "@/lib/api";
import { FALLBACK_CREDIT_SYMBOL, formatCatalogPrice } from "@/lib/billing/format";
import { parsePaidUsdCents } from "@/lib/esim/display";
import type { DisplayCurrency } from "@/types/billing";

/** Same degraded currency as CatalogPriceDisplay when config is unavailable. */
export const AUTO_TOPUP_FALLBACK_CURRENCY: DisplayCurrency = {
  symbol: FALLBACK_CREDIT_SYMBOL,
  name: "Credits",
  decimals: 2,
};

export function autoTopupPackageBaseLabel(
  pkg: Pick<TopupPackage, "title" | "validity_days">,
): string {
  return `${pkg.title} · ${pkg.validity_days} days`;
}

/**
 * `{title} · {validity_days} days · {price_usd}`.
 * Uses customer charge only. Invalid/negative price keeps the base label.
 */
export function autoTopupPackageOptionLabel(
  pkg: Pick<TopupPackage, "title" | "validity_days" | "price_usd">,
  currency: DisplayCurrency = AUTO_TOPUP_FALLBACK_CURRENCY,
): string {
  const base = autoTopupPackageBaseLabel(pkg);
  if (parsePaidUsdCents(pkg.price_usd) === null) {
    return base;
  }
  const { display } = formatCatalogPrice({
    amount: pkg.price_usd,
    currency,
  });
  return `${base} · ${display}`;
}
