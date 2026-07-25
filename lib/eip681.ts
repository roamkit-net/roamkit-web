/**
 * EIP-681 helpers for Polygon USDT deposits.
 * Base URI comes from GET /api/v1/billing/deposit-info/ (never hardcode chain/token).
 */

/** Append ERC-20 transfer amount in base units when the deposit amount is known. */
export function eip681UriWithAmount(
  baseUri: string,
  amount: string,
  tokenDecimals: number,
): string {
  const trimmed = baseUri.trim();
  if (!trimmed) {
    return "";
  }
  const baseUnits = amountToBaseUnits(amount, tokenDecimals);
  if (baseUnits === null) {
    return trimmed;
  }
  const separator = trimmed.includes("?") ? "&" : "?";
  // Avoid duplicating uint256 if the client already appended one.
  if (/[?&]uint256=/.test(trimmed)) {
    return trimmed.replace(/([?&]uint256=)[^&]*/, `$1${baseUnits}`);
  }
  return `${trimmed}${separator}uint256=${baseUnits}`;
}

/** Convert a decimal USDT amount string to integer base units, or null if invalid. */
export function amountToBaseUnits(
  amount: string,
  tokenDecimals: number,
): string | null {
  const normalized = amount.trim();
  if (!/^\d+(\.\d+)?$/.test(normalized)) {
    return null;
  }
  const [wholeRaw, fracRaw = ""] = normalized.split(".");
  if (fracRaw.length > tokenDecimals) {
    return null;
  }
  const whole = wholeRaw.replace(/^0+(?=\d)/, "") || "0";
  const frac = fracRaw.padEnd(tokenDecimals, "0");
  const digits = `${whole}${frac}`.replace(/^0+(?=\d)/, "") || "0";
  if (digits === "0") {
    return null;
  }
  return digits;
}

/** Validate a positive deposit amount with at most `maxDecimals` fractional digits. */
export function isValidDepositAmount(
  amount: string,
  maxDecimals = 6,
): boolean {
  const normalized = amount.trim();
  if (!/^\d+(\.\d+)?$/.test(normalized)) {
    return false;
  }
  const [, frac = ""] = normalized.split(".");
  if (frac.length > maxDecimals) {
    return false;
  }
  return amountToBaseUnits(normalized, maxDecimals) !== null;
}
