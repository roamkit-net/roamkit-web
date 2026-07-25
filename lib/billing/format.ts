/**
 * Shared money display helpers for prepaid credits.
 * Prefer these over ad-hoc NumberFormat in components.
 */

const CREDITS_FORMAT = new Intl.NumberFormat("en-US", {
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

/** Format account credit balance (e.g. `15.50`, `0.123456`). */
export function formatCredits(value: string | number): string {
  const n = parseAmount(value);
  if (n === null) {
    return String(value);
  }
  return CREDITS_FORMAT.format(n);
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

/** Format a USD money amount (orders / list prices). */
export function formatMoney(value: string | number): string {
  const n = parseAmount(value);
  if (n === null) {
    return String(value);
  }
  return MONEY_FORMAT.format(n);
}
