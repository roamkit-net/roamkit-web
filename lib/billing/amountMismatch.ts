import { ApiError } from "@/lib/api";
import { normalizeDepositAmount } from "@/lib/orders/insufficientCredits";

const MISMATCH_REASON_RE =
  /amount mismatch:\s*on-chain\s+(\d+(?:\.\d+)?)\s*!=\s*requested\s+(\d+(?:\.\d+)?)/i;

export type AmountMismatchInfo = {
  onChainAmount: string;
  requestedAmount: string | null;
};

function asRecord(body: unknown): Record<string, unknown> | null {
  if (!body || typeof body !== "object") {
    return null;
  }
  return body as Record<string, unknown>;
}

function readString(
  record: Record<string, unknown>,
  key: string,
): string | null {
  const value = record[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function fromReasonText(text: string): AmountMismatchInfo | null {
  const match = MISMATCH_REASON_RE.exec(text);
  if (!match) {
    return null;
  }
  return {
    onChainAmount: normalizeDepositAmount(match[1]),
    requestedAmount: normalizeDepositAmount(match[2]),
  };
}

/**
 * Parse structured AMOUNT_MISMATCH (or failure_reason text) from a verify error.
 */
export function parseAmountMismatch(error: unknown): AmountMismatchInfo | null {
  const body =
    error instanceof ApiError
      ? error.body
      : error && typeof error === "object" && "body" in error
        ? (error as { body?: unknown }).body
        : undefined;

  const record = asRecord(body);
  if (record) {
    const code = readString(record, "code");
    const onChain = readString(record, "on_chain_amount");
    if (code === "AMOUNT_MISMATCH" && onChain) {
      const requested =
        readString(record, "amount_requested") ??
        fromReasonText(readString(record, "failure_reason") ?? "")
          ?.requestedAmount ??
        null;
      return {
        onChainAmount: normalizeDepositAmount(onChain),
        requestedAmount: requested
          ? normalizeDepositAmount(requested)
          : null,
      };
    }
    const fromFailure = fromReasonText(
      readString(record, "failure_reason") ??
        readString(record, "detail") ??
        "",
    );
    if (fromFailure) {
      return fromFailure;
    }
  }

  if (error instanceof Error && error.message) {
    return fromReasonText(error.message);
  }
  return null;
}
