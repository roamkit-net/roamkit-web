"use client";

import { WalletDepositPanel } from "@/components/deposit/WalletDepositPanel";
import { AppKitProvider } from "@/components/wallet/AppKitProvider";
import type { BillingConfig, DepositRequest } from "@/types/billing";

type WalletDepositWithAppKitProps = {
  config: BillingConfig;
  amount: string;
  onAmountChange?: (amount: string) => void;
  onVerified: (deposit: DepositRequest) => void;
};

/** Lazy-loaded shell so AppKit/wagmi only load on /me/deposit when enabled. */
export function WalletDepositWithAppKit({
  config,
  amount,
  onAmountChange,
  onVerified,
}: WalletDepositWithAppKitProps) {
  return (
    <AppKitProvider>
      <WalletDepositPanel
        config={config}
        amount={amount}
        onAmountChange={onAmountChange}
        onVerified={onVerified}
      />
    </AppKitProvider>
  );
}
