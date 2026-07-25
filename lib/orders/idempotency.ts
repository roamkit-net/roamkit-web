import { newIdempotencyKey } from "@/lib/billing/idempotency";

/** Spend-specific idempotency keys (distinct prefix from deposit verifies). */
export function newSpendIdempotencyKey(prefix = "spend"): string {
  const base = newIdempotencyKey();
  if (base.startsWith("deposit-")) {
    return `${prefix}-${base.slice("deposit-".length)}`;
  }
  return `${prefix}-${base}`;
}
