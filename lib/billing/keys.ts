/**
 * Canonical React Query keys for billing.
 * Always use these — never ad-hoc string keys.
 */
export const billingKeys = {
  all: ["billing"] as const,
  balance: ["billing", "balance"] as const,
  /** Public GET /api/v1/billing/config/ — display currency. */
  config: ["billing", "config"] as const,
  depositInfo: ["billing", "deposit-info"] as const,
  transactions: ["billing", "transactions"] as const,
};

/** Align with API Cache-Control max-age=300 (5 minutes). */
export const BILLING_CONFIG_STALE_TIME_MS = 300_000;
