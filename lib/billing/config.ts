import type {
  BillingConfig,
  BillingConfigResponse,
  BillingDisplayConfig,
  BillingFeatures,
  DepositInfo,
  DisplayCurrency,
} from "@/types/billing";

/** Map public billing/config → DisplayCurrency (UI formatting). */
export function toDisplayCurrency(
  payload: BillingConfigResponse,
): DisplayCurrency {
  return {
    symbol: payload.token_symbol,
    name: payload.token_name,
    decimals: payload.display_decimals,
  };
}

/** Map public billing/config → BillingDisplayConfig for caches / hooks. */
export function toBillingDisplayConfig(
  payload: BillingConfigResponse,
): BillingDisplayConfig {
  return {
    currency: toDisplayCurrency(payload),
    configVersion: payload.config_version,
    billingEnabled: payload.billing_enabled,
    tokenDecimals: payload.token_decimals,
  };
}

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
    vouchers: info?.vouchers_enabled ?? false,
  };
}
