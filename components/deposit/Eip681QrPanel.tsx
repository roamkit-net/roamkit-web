"use client";

import { QRCodeSVG } from "qrcode.react";
import { useEffect, useMemo, useState } from "react";

import { billingTelemetry } from "@/lib/billing/telemetry";
import { eip681UriWithAmount, isValidDepositAmount } from "@/lib/eip681";
import type { BillingConfig } from "@/types/billing";

type Eip681QrPanelProps = {
  config: BillingConfig;
  amount: string;
};

export function Eip681QrPanel({ config, amount }: Eip681QrPanelProps) {
  const [copied, setCopied] = useState<"wallet" | "uri" | null>(null);

  const uri = useMemo(
    () => eip681UriWithAmount(config.eip681Uri, amount, config.decimals),
    [amount, config.decimals, config.eip681Uri],
  );

  useEffect(() => {
    if (!uri || !isValidDepositAmount(amount, config.decimals)) {
      return;
    }
    billingTelemetry.track("deposit_qr_generated", {
      has_amount: true,
    });
  }, [amount, config.decimals, uri]);

  async function copy(value: string, kind: "wallet" | "uri") {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(kind);
      window.setTimeout(() => setCopied(null), 2000);
    } catch {
      setCopied(null);
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Scan EIP-681 QR</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        Scan with a wallet that supports EIP-681 to send {config.tokenSymbol}{" "}
        (chain {config.chainId}). Enter an amount above to include it in the
        payment request.
      </p>

      <div className="mt-6 flex flex-col items-center gap-4 sm:flex-row sm:items-start">
        <div className="rounded-xl border border-slate-100 bg-white p-3">
          {uri ? (
            <QRCodeSVG value={uri} size={180} level="M" includeMargin />
          ) : (
            <div className="flex h-[180px] w-[180px] items-center justify-center text-sm text-slate-500">
              Deposit address unavailable
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-sky-700">
              Platform wallet
            </p>
            <p className="mt-1 break-all font-mono text-sm text-slate-900">
              {config.wallet || "—"}
            </p>
            {config.wallet ? (
              <button
                type="button"
                className="mt-2 text-sm font-medium text-sky-700 hover:text-sky-800"
                onClick={() => void copy(config.wallet, "wallet")}
              >
                {copied === "wallet" ? "Copied" : "Copy address"}
              </button>
            ) : null}
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-sky-700">
              EIP-681 URI
            </p>
            <p className="mt-1 break-all font-mono text-xs text-slate-600">
              {uri || "—"}
            </p>
            {uri ? (
              <button
                type="button"
                className="mt-2 text-sm font-medium text-sky-700 hover:text-sky-800"
                onClick={() => void copy(uri, "uri")}
              >
                {copied === "uri" ? "Copied" : "Copy URI"}
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
