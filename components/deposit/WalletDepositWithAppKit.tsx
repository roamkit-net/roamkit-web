"use client";

import { WalletDepositPanel } from "@/components/deposit/WalletDepositPanel";
import { AppKitProvider } from "@/components/wallet/AppKitProvider";
import type { DepositInfo, DepositRequest } from "@/lib/billing";

type WalletDepositWithAppKitProps = {
  depositInfo: DepositInfo;
  amount: string;
  onVerified: (deposit: DepositRequest) => void;
};

/** Lazy-loaded shell so AppKit/wagmi only load on /me/deposit when enabled. */
export function WalletDepositWithAppKit({
  depositInfo,
  amount,
  onVerified,
}: WalletDepositWithAppKitProps) {
  return (
    <AppKitProvider>
      <WalletDepositPanel
        depositInfo={depositInfo}
        amount={amount}
        onVerified={onVerified}
      />
    </AppKitProvider>
  );
}
