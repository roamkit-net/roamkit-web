/**
 * Canonical React Query keys for billing.
 * Always use these — never ad-hoc string keys.
 */
export const billingKeys = {
  all: ["billing"] as const,
  balance: ["billing", "balance"] as const,
  depositInfo: ["billing", "deposit-info"] as const,
  transactions: ["billing", "transactions"] as const,
};
