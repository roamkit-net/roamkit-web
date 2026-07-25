import { ApiError } from "@/lib/api";
import type { InsufficientCreditsPayload } from "@/types/orders";

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

/** Only same-origin relative paths (blocks open redirects). */
export function isSafeReturnPath(path: string): boolean {
  if (!path.startsWith("/") || path.startsWith("//")) {
    return false;
  }
  if (path.includes("://")) {
    return false;
  }
  return true;
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
