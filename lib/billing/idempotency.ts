/** Stable idempotency keys for deposit verify requests. */

export function newIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `deposit-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
