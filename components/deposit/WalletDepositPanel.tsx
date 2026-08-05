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

import { DepositTxExplorerLink } from "@/components/deposit/DepositTxExplorerLink";
import { Card, CardSection } from "@/components/ui/Card";
import { parseAmountMismatch } from "@/lib/billing/amountMismatch";
import { verifyWallet } from "@/lib/billing/client";
import {
  formatDepositPendingMessage,
  isDepositFailed,
  isDepositVerified,
} from "@/lib/billing/deposit";
import { depositCopy } from "@/lib/billing/depositCopy";
import { toBillingError } from "@/lib/billing/errors";
import { newIdempotencyKey } from "@/lib/billing/idempotency";
import {
  clearPendingDeposit,
  savePendingDeposit,
  type PendingDepositSession,
} from "@/lib/billing/pendingDeposit";
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
  onAmountChange?: (amount: string) => void;
  onVerified: (deposit: DepositRequest) => void;
  resumeRequest?: PendingDepositSession | null;
  onResumeConsumed?: () => void;
  onVerifyStart?: () => void;
};

type ExplorerStatus = "pending" | "completed" | "failed";

export function WalletDepositPanel({
  config,
  amount,
  onAmountChange,
  onVerified,
  resumeRequest = null,
  onResumeConsumed,
  onVerifyStart,
}: WalletDepositPanelProps) {
  const { open } = useAppKit();
  const { address, isConnected } = useAppKitAccount();
  const { chainId, switchNetwork } = useAppKitNetwork();
  const { walletProvider } = useAppKitProvider<Eip1193Provider>("eip155");

  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [activeTxHash, setActiveTxHash] = useState<string | null>(null);
  const [explorerStatus, setExplorerStatus] =
    useState<ExplorerStatus>("pending");
  const [mismatchAmount, setMismatchAmount] = useState<string | null>(null);
  const [retryPending, setRetryPending] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const mismatchAlertRef = useRef<HTMLDivElement | null>(null);
  const resumeStartedRef = useRef(false);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (mismatchAmount && mismatchAlertRef.current) {
      mismatchAlertRef.current.focus();
    }
  }, [mismatchAmount]);

  const verifyHash = useCallback(
    async (
      hash: string,
      idempotencyKey: string,
      amountRequested: string,
      { isRetry }: { isRetry: boolean },
    ) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      const trimmedAmount = amountRequested.trim();

      onVerifyStart?.();
      savePendingDeposit({
        txHash: hash,
        amount: trimmedAmount,
        idempotencyKey,
        method: "wallet",
      });

      setIsVerifying(true);
      setError(null);
      setMismatchAmount(null);
      setActiveTxHash(hash);
      setExplorerStatus("pending");
      billingTelemetry.track("deposit_verify_clicked", {
        method: "wallet",
        ...(isRetry ? { retry: true } : {}),
      });
      if (isRetry) {
        billingTelemetry.track("deposit_retry_clicked", { method: "wallet" });
      }

      try {
        const deposit = await verifyDepositUntilSettled(
          (body, signal) => verifyWallet(body, signal),
          {
            tx_hash: hash,
            amount_requested: trimmedAmount,
            idempotency_key: idempotencyKey,
          },
          {
            signal: controller.signal,
            onUpdate: (current) => {
              const status = current.status?.trim().toLowerCase();
              if (!status || status === "pending") {
                savePendingDeposit({
                  txHash: hash,
                  amount: trimmedAmount,
                  idempotencyKey,
                  method: "wallet",
                });
                setExplorerStatus("pending");
                setStatusMessage(
                  formatDepositPendingMessage(current, config.confirmations),
                );
              }
            },
          },
        );

        if (isDepositVerified(deposit)) {
          clearPendingDeposit();
          billingTelemetry.track("deposit_verify_succeeded", {
            method: "wallet",
          });
          if (isRetry) {
            billingTelemetry.track("deposit_retry_success", {
              method: "wallet",
            });
          }
          setExplorerStatus("completed");
          setRetryPending(false);
          onVerified(deposit);
          setStatusMessage(depositCopy.walletVerified);
          return;
        }

        if (isDepositFailed(deposit)) {
          clearPendingDeposit();
          billingTelemetry.track("deposit_verify_failed", {
            method: "wallet",
            code: "FAILED",
          });
          setExplorerStatus("failed");
          setError(deposit.failure_reason || depositCopy.walletFailedFallback);
          return;
        }

        setExplorerStatus("pending");
        setStatusMessage(
          formatDepositPendingMessage(deposit, config.confirmations),
        );
      } catch (err) {
        const mapped = toBillingError(err);
        if (mapped.code === "ABORTED") {
          return;
        }
        const mismatch = parseAmountMismatch(err);
        billingTelemetry.track("deposit_verify_failed", {
          method: "wallet",
          code: mismatch ? "AMOUNT_MISMATCH" : mapped.code,
          category: mapped.category,
        });
        setExplorerStatus(mapped.category === "pending" ? "pending" : "failed");
        if (mismatch) {
          clearPendingDeposit();
          setMismatchAmount(mismatch.onChainAmount);
          setError(null);
          setStatusMessage(null);
        } else if (mapped.category === "pending") {
          setError(mapped.message);
        } else {
          clearPendingDeposit();
          setError(mapped.message);
        }
      } finally {
        setIsVerifying(false);
      }
    },
    [config.confirmations, onVerified, onVerifyStart],
  );

  useEffect(() => {
    if (!resumeRequest) {
      resumeStartedRef.current = false;
      return;
    }
    if (resumeRequest.method !== "wallet") {
      return;
    }
    if (resumeStartedRef.current) {
      return;
    }
    resumeStartedRef.current = true;
    const {
      txHash: hash,
      amount: resumeAmount,
      idempotencyKey: key,
    } = resumeRequest;
    onResumeConsumed?.();
    onAmountChange?.(resumeAmount);
    void verifyHash(hash, key, resumeAmount, { isRetry: false });
  }, [resumeRequest, onAmountChange, onResumeConsumed, verifyHash]);

  async function handlePay() {
    setError(null);
    setStatusMessage(null);
    setMismatchAmount(null);

    if (!isValidDepositAmount(amount, config.decimals)) {
      setError(`Enter a valid amount (max ${config.decimals} decimal places).`);
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

      setActiveTxHash(hash);
      setExplorerStatus("pending");
      setStatusMessage(`Transaction sent (${hash.slice(0, 10)}…). Verifying…`);
      await tx.wait();
      await verifyHash(hash, idempotencyKey, amount, { isRetry: false });
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

  async function handleRetryWithReceived() {
    if (!mismatchAmount || !activeTxHash) {
      return;
    }
    onAmountChange?.(mismatchAmount);
    setRetryPending(true);
    const key = newIdempotencyKey();
    await verifyHash(activeTxHash, key, mismatchAmount, { isRetry: true });
  }

  const busy = isSending || isVerifying;
  const showExplorer =
    Boolean(activeTxHash) && (error || statusMessage || mismatchAmount);

  return (
    <Card as="section">
      <CardSection>
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

        {mismatchAmount ? (
          <div
            ref={mismatchAlertRef}
            tabIndex={-1}
            className="mt-4 space-y-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-950 outline-none ring-sky-600 focus:ring-2"
            role="alert"
            data-testid="deposit-amount-mismatch"
          >
            <p className="font-semibold">{depositCopy.amountMismatchTitle}</p>
            <p className="leading-6">
              {depositCopy.amountMismatchBody(
                config.tokenSymbol,
                mismatchAmount,
              )}
            </p>
            <p>
              {depositCopy.amountMismatchReceivedLabel}:{" "}
              <span className="font-mono font-semibold tabular-nums">
                {mismatchAmount} {config.tokenSymbol}
              </span>
            </p>
            {showExplorer && activeTxHash ? (
              <DepositTxExplorerLink
                chainId={config.chainId}
                txHash={activeTxHash}
                method="wallet"
                status="failed"
              />
            ) : null}
            <button
              type="button"
              disabled={busy}
              onClick={() => void handleRetryWithReceived()}
              className="inline-flex items-center justify-center rounded-xl bg-sky-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {depositCopy.amountMismatchRetry(
                mismatchAmount,
                config.tokenSymbol,
              )}
            </button>
          </div>
        ) : null}

        {error ? (
          <div className="mt-4 space-y-2">
            <p
              className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900"
              role="alert"
            >
              {error}
            </p>
            {showExplorer && activeTxHash ? (
              <DepositTxExplorerLink
                chainId={config.chainId}
                txHash={activeTxHash}
                method="wallet"
                status={explorerStatus}
              />
            ) : null}
          </div>
        ) : null}
        {statusMessage ? (
          <div className="mt-4 space-y-2">
            <p
              className="rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-900"
              role="status"
              aria-live="polite"
            >
              {statusMessage}
            </p>
            {showExplorer && activeTxHash && !error && !mismatchAmount ? (
              <DepositTxExplorerLink
                chainId={config.chainId}
                txHash={activeTxHash}
                method="wallet"
                status={explorerStatus}
              />
            ) : null}
          </div>
        ) : null}

        <button
          type="button"
          disabled={busy}
          onClick={() => void handlePay()}
          className="mt-6 inline-flex items-center justify-center rounded-xl bg-sky-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy
            ? isVerifying || retryPending
              ? "Verifying…"
              : "Sending…"
            : isConnected
              ? `Pay ${amount || "…"} ${config.tokenSymbol}`
              : "Connect & pay with wallet"}
        </button>
      </CardSection>
    </Card>
  );
}
