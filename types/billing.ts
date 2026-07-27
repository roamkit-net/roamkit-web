/** Domain types for prepaid credits billing (ADR-010). */

export type BillingBalance = {
  balance: string;
};

/** Raw GET /api/v1/billing/config/ payload (public display config). */
export type BillingConfigResponse = {
  config_version: number;
  token_symbol: string;
  token_name: string;
  token_decimals: number;
  display_decimals: number;
  billing_enabled: boolean;
};

/**
 * Internal display currency for catalog / checkout copy.
 * Do not assume a single forever-symbol — always from billing/config.
 */
export type DisplayCurrency = {
  /** From token_symbol; empty → formatters fall back to `"credits"`. */
  symbol: string;
  /** From token_name. */
  name: string;
  /** display_decimals — UI formatting precision. */
  decimals: number;
};

/** Input to CatalogPriceDisplay / formatCatalogPrice. */
export type CatalogPrice = {
  amount: string;
  currency: DisplayCurrency;
  from?: boolean;
};

/** Mapped public billing/config for UI caches. */
export type BillingDisplayConfig = {
  currency: DisplayCurrency;
  configVersion: number;
  billingEnabled: boolean;
  /** Ledger / on-chain precision (not used for catalog UI formatting). */
  tokenDecimals: number;
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
  /** Present once API companion lands; treat missing as false. */
  vouchers_enabled?: boolean;
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
  vouchers: boolean;
};

export type VoucherRedeemResponse = {
  credited: string;
  balance: string;
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
