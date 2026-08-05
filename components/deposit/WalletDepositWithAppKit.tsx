"use client";

import { WalletDepositPanel } from "@/components/deposit/WalletDepositPanel";
import { AppKitProvider } from "@/components/wallet/AppKitProvider";
import type { PendingDepositSession } from "@/lib/billing/pendingDeposit";
import type { BillingConfig, DepositRequest } from "@/types/billing";

type WalletDepositWithAppKitProps = {
  config: BillingConfig;
  amount: string;
  onAmountChange?: (amount: string) => void;
  onVerified: (deposit: DepositRequest) => void;
  resumeRequest?: PendingDepositSession | null;
  onResumeConsumed?: () => void;
  onVerifyStart?: () => void;
};

/** Lazy-loaded shell so AppKit/wagmi only load on /me/deposit when enabled. */
export function WalletDepositWithAppKit({
  config,
  amount,
  onAmountChange,
  onVerified,
  resumeRequest = null,
  onResumeConsumed,
  onVerifyStart,
}: WalletDepositWithAppKitProps) {
  return (
    <AppKitProvider>
      <WalletDepositPanel
        config={config}
        amount={amount}
        onAmountChange={onAmountChange}
        onVerified={onVerified}
        resumeRequest={resumeRequest}
        onResumeConsumed={onResumeConsumed}
        onVerifyStart={onVerifyStart}
      />
    </AppKitProvider>
  );
}
