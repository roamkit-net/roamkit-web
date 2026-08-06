/**
 * UI hint only — never treat this as a business rule or security check.
 * Backend / CreditService remains the source of truth for affordability.
 *
 * Client-side affordability hint for shortfall CTA vs Buy (never a security gate).
 * Prefer `computeMissingCredits` when you need the deposit prefill amount.
 *
 * @returns `true` if balance covers price, `false` if short, `null` if unknown
 *   (balance missing / unparseable — treat as Buy, not shortfall CTA).
 */
export function hasSufficientCredits(
  balance: string | null | undefined,
  price: string,
): boolean | null {
  if (balance == null || balance === "") {
    return null;
  }
  const balanceAmount = Number(balance);
  const priceAmount = Number(price);
  if (!Number.isFinite(balanceAmount) || !Number.isFinite(priceAmount)) {
    return null;
  }
  return balanceAmount >= priceAmount;
}
