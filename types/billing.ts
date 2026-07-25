/** Domain types for prepaid credits billing (ADR-010). */

export type BillingBalance = {
  balance: string;
};

/** Raw GET /api/v1/billing/deposit-info/ payload. Prefer BillingConfig in UI. */
export type DepositInfo = {
  wallet: string;
  chain_id: number;
  token_symbol: string;
  token_decimals: number;
  contract: string;
  min_confirmations: number;
  eip681_uri: string;
  walletconnect_enabled: boolean;
  subscriptions_enabled: boolean;
};

/** Mapped deposit-info for UI — never hardcode these values. */
export type BillingConfig = {
  wallet: string;
  chainId: number;
  tokenSymbol: string;
  decimals: number;
  contract: string;
  confirmations: number;
  eip681Uri: string;
};

export type BillingFeatures = {
  billingEnabled: boolean;
  walletConnect: boolean;
  subscriptions: boolean;
};

export type DepositStatus = "pending" | "completed" | "failed";

export type DepositPaymentMethod = "wallet_connect" | "cex_manual";

export type DepositRequest = {
  id: string;
  amount_requested: string;
  amount_credited: string | null;
  payment_method: DepositPaymentMethod | string;
  tx_hash: string | null;
  idempotency_key: string;
  status: DepositStatus | string;
  failure_reason: string | null;
  verified_at: string | null;
  created_at: string;
  updated_at: string;
  /** Present on 202 insufficient-confirmations responses. */
  confirmations?: number;
  required_confirmations?: number;
};

export type VerifyDepositPayload = {
  tx_hash: string;
  amount_requested: string;
  idempotency_key: string;
};
