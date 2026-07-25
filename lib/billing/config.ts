import type {
  BillingConfig,
  BillingFeatures,
  DepositInfo,
} from "@/types/billing";

/** Map deposit-info (SSoT) → BillingConfig. UI reads config only. */
export function toBillingConfig(info: DepositInfo): BillingConfig {
  return {
    wallet: info.wallet,
    chainId: info.chain_id,
    tokenSymbol: info.token_symbol,
    decimals: info.token_decimals,
    contract: info.contract,
    confirmations: info.min_confirmations,
    eip681Uri: info.eip681_uri,
  };
}

type BillingFeaturesOptions = {
  billingEnabled: boolean;
};

/**
 * Feature flags from deposit-info.
 * `billingEnabled` is true when deposit-info was successfully loaded
 * (API returns 404 when BILLING_ENABLED=false).
 */
export function toBillingFeatures(
  info: DepositInfo | null | undefined,
  options: BillingFeaturesOptions,
): BillingFeatures {
  return {
    billingEnabled: options.billingEnabled,
    walletConnect: info?.walletconnect_enabled ?? false,
    subscriptions: info?.subscriptions_enabled ?? false,
  };
}
