import { ApiError } from "@/lib/api";
import {
  FALLBACK_CREDIT_SYMBOL,
  formatCredits,
} from "@/lib/billing/format";
import { isSafeReturnPath } from "@/lib/navigation/safePath";
import type { InsufficientCreditsPayload } from "@/types/orders";

export { isSafeReturnPath } from "@/lib/navigation/safePath";

/**
 * Sole shortfall calculator — components must not do local `price - balance`.
 *
 * @returns normalized missing amount, or `null` when not short / unparseable
 *   (including when balance ≥ price — never a negative string).
 */
export function computeMissingCredits(
  balance: string,
  price: string,
): string | null {
  const balanceAmount = Number(balance);
  const priceAmount = Number(price);
  if (!Number.isFinite(balanceAmount) || !Number.isFinite(priceAmount)) {
    return null;
  }
  const missing = priceAmount - balanceAmount;
  if (missing <= 0) {
    return null;
  }
  return normalizeDepositAmount(String(missing));
}

/**
 * Shortfall CTA copy: zero balance → generic; otherwise show missing amount.
 */
export function shortfallCtaLabel(options: {
  missing: string;
  balance: string;
  tokenSymbol?: string | null;
}): string {
  const balanceAmount = Number(options.balance);
  if (Number.isFinite(balanceAmount) && balanceAmount <= 0) {
    return "Add credits";
  }
  const symbol = options.tokenSymbol?.trim() || FALLBACK_CREDIT_SYMBOL;
  return `Add ${formatCredits(options.missing, 2)} ${symbol}`;
}

function asRecord(body: unknown): Record<string, unknown> | null {
  if (!body || typeof body !== "object") {
    return null;
  }
  return body as Record<string, unknown>;
}

function readString(record: Record<string, unknown>, key: string): string | null {
  const value = record[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

/** True when the API rejected a spend with HTTP 402 INSUFFICIENT_CREDITS. */
export function isInsufficientCreditsError(error: unknown): boolean {
  if (!(error instanceof ApiError) || error.status !== 402) {
    return false;
  }
  const record = asRecord(error.body);
  if (!record) {
    return true;
  }
  const code = readString(record, "code");
  return code === null || code === "INSUFFICIENT_CREDITS";
}

/** Parse structured 402 payload; returns null when fields are missing. */
export function parseInsufficientCredits(
  error: unknown,
): InsufficientCreditsPayload | null {
  if (!(error instanceof ApiError) || error.status !== 402) {
    return null;
  }
  const record = asRecord(error.body);
  if (!record) {
    return null;
  }
  const code = readString(record, "code");
  if (code !== null && code !== "INSUFFICIENT_CREDITS") {
    return null;
  }
  const required = readString(record, "required");
  const balance = readString(record, "balance");
  const missing = readString(record, "missing");
  if (!required || !balance || !missing) {
    return null;
  }
  return {
    code: "INSUFFICIENT_CREDITS",
    detail: readString(record, "detail") || "Insufficient funds",
    required,
    balance,
    missing,
  };
}

/**
 * Trim trailing fractional zeros for deposit prefill (`11.500000` → `11.5`).
 * Returns the original trimmed string when not a plain decimal.
 */
export function normalizeDepositAmount(value: string): string {
  const trimmed = value.trim();
  if (!/^\d+(\.\d+)?$/.test(trimmed)) {
    return trimmed;
  }
  const [wholeRaw, fracRaw = ""] = trimmed.split(".");
  const whole = wholeRaw.replace(/^0+(?=\d)/, "") || "0";
  const frac = fracRaw.replace(/0+$/, "");
  return frac ? `${whole}.${frac}` : whole;
}

/** Build `/me/deposit?amount=&return=` for the 402 → deposit hop. */
export function buildDepositRedirectUrl(options: {
  amount: string;
  returnPath: string;
}): string {
  const params = new URLSearchParams();
  const amount = normalizeDepositAmount(options.amount);
  if (amount) {
    params.set("amount", amount);
  }
  if (isSafeReturnPath(options.returnPath)) {
    params.set("return", options.returnPath);
  }
  const query = params.toString();
  return query ? `/me/deposit?${query}` : "/me/deposit";
}
