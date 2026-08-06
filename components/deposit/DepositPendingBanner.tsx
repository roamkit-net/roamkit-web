"use client";

import { DepositTxExplorerLink } from "@/components/deposit/DepositTxExplorerLink";
import { buttonClassName } from "@/components/ui/Button";
import { depositCopy } from "@/lib/billing/depositCopy";
import {
  truncateTxHash,
  type PendingDepositSession,
} from "@/lib/billing/pendingDeposit";

type DepositPendingBannerProps = {
  session: PendingDepositSession;
  chainId: number;
  onContinue: () => void;
  onDismiss: () => void;
};

/**
 * Shown when a prior verify was interrupted (refresh / leave mid-poll).
 * Does not start verify until the user chooses Continue.
 */
export function DepositPendingBanner({
  session,
  chainId,
  onContinue,
  onDismiss,
}: DepositPendingBannerProps) {
  const truncated = truncateTxHash(session.txHash);
  const methodLabel =
    session.method === "cex"
      ? depositCopy.pendingMethodCex
      : depositCopy.pendingMethodWallet;

  return (
    <aside
      data-testid="deposit-pending-banner"
      className="rounded-2xl border border-sky-200 bg-sky-50 p-5 text-sky-950 shadow-sm"
      role="status"
      aria-live="polite"
    >
      <p className="text-base font-semibold">
        {depositCopy.pendingBannerTitle}
      </p>
      <p className="mt-2 text-sm leading-6 text-sky-900">
        {depositCopy.pendingBannerBody(truncated, methodLabel, session.amount)}
      </p>
      <div className="mt-3">
        <DepositTxExplorerLink
          chainId={chainId}
          txHash={session.txHash}
          method={session.method}
          status="pending"
        />
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          data-testid="deposit-pending-continue"
          onClick={onContinue}
          className={buttonClassName({
            variant: "primary",
            size: "lg",
            tone: "app",
          })}
        >
          {depositCopy.pendingContinue}
        </button>
        <button
          type="button"
          data-testid="deposit-pending-dismiss"
          onClick={onDismiss}
          className="inline-flex items-center justify-center rounded-xl border border-sky-300 bg-white px-4 py-2.5 text-sm font-semibold text-sky-900 hover:bg-sky-100"
        >
          {depositCopy.pendingDismiss}
        </button>
      </div>
    </aside>
  );
}
