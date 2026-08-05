"use client";

import { useEffect, useRef } from "react";

import { depositCopy } from "@/lib/billing/depositCopy";
import { billingTelemetry } from "@/lib/billing/telemetry";

type DepositNetworkWarningProps = {
  tokenSymbol: string;
  chainId: number;
};

/**
 * Must appear before QR / address copy so users see Polygon-only rules first.
 */
export function DepositNetworkWarning({
  tokenSymbol,
  chainId,
}: DepositNetworkWarningProps) {
  const trackedRef = useRef(false);

  useEffect(() => {
    if (trackedRef.current) {
      return;
    }
    trackedRef.current = true;
    billingTelemetry.track("deposit_network_warning_seen", {
      chain_id: chainId,
      token_symbol: tokenSymbol,
    });
  }, [chainId, tokenSymbol]);

  return (
    <aside
      data-testid="deposit-network-warning"
      className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-950"
      role="note"
      aria-labelledby="deposit-network-warning-title"
    >
      <h2
        id="deposit-network-warning-title"
        className="text-base font-semibold tracking-tight"
      >
        {depositCopy.networkWarningTitle}
      </h2>
      <p className="mt-2 text-sm leading-6">
        {depositCopy.networkWarningLead(tokenSymbol, chainId)}
      </p>
      <ul className="mt-3 list-disc space-y-1 pl-5 text-sm leading-6">
        <li>{depositCopy.networkWarningDontEthereum}</li>
        <li>{depositCopy.networkWarningDontTron}</li>
        <li>{depositCopy.networkWarningDontBsc}</li>
      </ul>
    </aside>
  );
}
