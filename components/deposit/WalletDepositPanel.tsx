"use client";

import {
  useAppKit,
  useAppKitAccount,
  useAppKitNetwork,
  useAppKitProvider,
} from "@reown/appkit/react";
import { polygon } from "@reown/appkit/networks";
import {
  BrowserProvider,
  Contract,
  parseUnits,
  type Eip1193Provider,
} from "ethers";
import { useCallback, useEffect, useRef, useState } from "react";

import { verifyWallet } from "@/lib/billing/client";
import {
  formatDepositPendingMessage,
  isDepositFailed,
  isDepositVerified,
} from "@/lib/billing/deposit";
import { depositCopy } from "@/lib/billing/depositCopy";
import { toBillingError } from "@/lib/billing/errors";
import { newIdempotencyKey } from "@/lib/billing/idempotency";
import { billingTelemetry } from "@/lib/billing/telemetry";
import { verifyDepositUntilSettled } from "@/lib/billing/verifyPoll";
import { isValidDepositAmount } from "@/lib/eip681";
import type { BillingConfig, DepositRequest } from "@/types/billing";

const ERC20_ABI = [
  "function transfer(address to, uint256 value) returns (bool)",
] as const;

type WalletDepositPanelProps = {
  config: BillingConfig;
  amount: string;
  onVerified: (deposit: DepositRequest) => void;
};

export function WalletDepositPanel({
  config,
  amount,
  onVerified,
}: WalletDepositPanelProps) {
  const { open } = useAppKit();
  const { address, isConnected } = useAppKitAccount();
  const { chainId, switchNetwork } = useAppKitNetwork();
  const { walletProvider } = useAppKitProvider<Eip1193Provider>("eip155");

  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const verifyHash = useCallback(
    async (hash: string, idempotencyKey: string) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setIsVerifying(true);
      setError(null);
      billingTelemetry.track("deposit_verify_clicked", { method: "wallet" });

      try {
        const deposit = await verifyDepositUntilSettled(
          (body, signal) => verifyWallet(body, signal),
          {
            tx_hash: hash,
            amount_requested: amount.trim(),
            idempotency_key: idempotencyKey,
          },
          {
            signal: controller.signal,
            onUpdate: (current) => {
              const status = current.status?.trim().toLowerCase();
              if (!status || status === "pending") {
                setStatusMessage(
                  formatDepositPendingMessage(current, config.confirmations),
                );
              }
            },
          },
        );

        if (isDepositVerified(deposit)) {
          billingTelemetry.track("deposit_verify_succeeded", {
            method: "wallet",
          });
          onVerified(deposit);
          setStatusMessage("Deposit verified. Credits added to your balance.");
          return;
        }

        if (isDepositFailed(deposit)) {
          billingTelemetry.track("deposit_verify_failed", {
            method: "wallet",
            code: "FAILED",
          });
          setError(
            deposit.failure_reason || "Wallet deposit could not be verified.",
          );
          return;
        }

        setStatusMessage(
          formatDepositPendingMessage(deposit, config.confirmations),
        );
      } catch (err) {
        const mapped = toBillingError(err);
        if (mapped.code === "ABORTED") {
          return;
        }
        billingTelemetry.track("deposit_verify_failed", {
          method: "wallet",
          code: mapped.code,
          category: mapped.category,
        });
        setError(mapped.message);
      } finally {
        setIsVerifying(false);
      }
    },
    [amount, config.confirmations, onVerified],
  );

  async function handlePay() {
    setError(null);
    setStatusMessage(null);

    if (!isValidDepositAmount(amount, config.decimals)) {
      setError(
        `Enter a valid amount (max ${config.decimals} decimal places).`,
      );
      return;
    }

    if (!config.wallet || !config.contract) {
      setError("Deposit destination is not configured.");
      return;
    }

    if (!isConnected || !walletProvider) {
      open({ view: "Connect" });
      return;
    }

    setIsSending(true);
    const idempotencyKey = newIdempotencyKey();
    try {
      if (Number(chainId) !== config.chainId) {
        // AppKit network object for the deposit chain (config.chainId is SSoT).
        await switchNetwork(polygon);
      }

      const provider = new BrowserProvider(walletProvider);
      const signer = await provider.getSigner();
      const token = new Contract(config.contract, ERC20_ABI, signer);
      const value = parseUnits(amount.trim(), config.decimals);
      const tx = await token.getFunction("transfer")(config.wallet, value);
      const hash = typeof tx.hash === "string" ? tx.hash : String(tx.hash);

      setStatusMessage(`Transaction sent (${hash.slice(0, 10)}…). Verifying…`);
      await tx.wait();
      await verifyHash(hash, idempotencyKey);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Wallet payment failed.";
      if (
        /user rejected|denied|rejected the request|ACTION_REJECTED/i.test(
          message,
        )
      ) {
        setError("Transaction was rejected in the wallet.");
      } else {
        setError(message);
      }
    } finally {
      setIsSending(false);
    }
  }

  const busy = isSending || isVerifying;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">
        {depositCopy.walletHeading}
      </h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        {depositCopy.walletDescription(config.tokenSymbol)}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-600">
        {isConnected && address ? (
          <p>
            Connected:{" "}
            <span className="font-mono text-slate-900">
              {address.slice(0, 6)}…{address.slice(-4)}
            </span>
          </p>
        ) : (
          <p>No wallet connected yet.</p>
        )}
        <button
          type="button"
          className="font-medium text-sky-700 hover:text-sky-800"
          onClick={() => open()}
        >
          {isConnected ? "Manage wallet" : "Connect wallet"}
        </button>
      </div>

      {error ? (
        <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {error}
        </p>
      ) : null}
      {statusMessage ? (
        <p className="mt-4 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-900">
          {statusMessage}
        </p>
      ) : null}

      <button
        type="button"
        disabled={busy}
        onClick={() => void handlePay()}
        className="mt-6 inline-flex items-center justify-center rounded-xl bg-sky-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {busy
          ? isVerifying
            ? "Verifying…"
            : "Sending…"
          : isConnected
            ? `Pay ${amount || "…"} ${config.tokenSymbol}`
            : "Connect & pay with wallet"}
      </button>
    </section>
  );
}
