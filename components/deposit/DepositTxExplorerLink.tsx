"use client";

import { explorerName, txExplorerUrl } from "@/lib/billing/explorer";
import { depositCopy } from "@/lib/billing/depositCopy";
import { billingTelemetry } from "@/lib/billing/telemetry";

type DepositTxExplorerLinkProps = {
  chainId: number;
  txHash: string;
  method: "cex" | "wallet";
  status: "pending" | "completed" | "failed";
  className?: string;
};

export function DepositTxExplorerLink({
  chainId,
  txHash,
  method,
  status,
  className = "",
}: DepositTxExplorerLinkProps) {
  const url = txExplorerUrl(chainId, txHash);
  const name = explorerName(chainId);
  if (!url || !name) {
    return null;
  }

  const label = depositCopy.viewOnExplorer(name);

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      data-testid="deposit-tx-explorer-link"
      data-status={status}
      className={`inline-flex text-sm font-medium text-sky-700 underline hover:text-sky-900 ${className}`.trim()}
      aria-label={depositCopy.viewOnExplorerAria(name)}
      onClick={() => {
        billingTelemetry.track("deposit_explorer_opened", {
          method,
          status,
          chain_id: chainId,
        });
      }}
    >
      {label}
    </a>
  );
}
