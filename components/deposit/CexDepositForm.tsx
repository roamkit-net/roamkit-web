"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

import { DepositTxExplorerLink } from "@/components/deposit/DepositTxExplorerLink";
import { Card, CardSection } from "@/components/ui/Card";
import { parseAmountMismatch } from "@/lib/billing/amountMismatch";
import { verifyCex } from "@/lib/billing/client";
import {
  formatDepositPendingMessage,
  isDepositFailed,
  isDepositVerified,
} from "@/lib/billing/deposit";
import { depositCopy } from "@/lib/billing/depositCopy";
import { toBillingError } from "@/lib/billing/errors";
import { addressExplorerUrl, explorerName } from "@/lib/billing/explorer";
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

type CexDepositFormProps = {
  config: BillingConfig;
  amount: string;
  onAmountChange?: (amount: string) => void;
  onVerified: (deposit: DepositRequest) => void;
  /** When set (method cex), resume verify once — parent clears after consume. */
  resumeRequest?: PendingDepositSession | null;
  onResumeConsumed?: () => void;
  /** Hide page pending banner when a verify starts from this form. */
  onVerifyStart?: () => void;
};

type ExplorerStatus = "pending" | "completed" | "failed";

function normalizeTxHash(value: string): string {
  const trimmed = value.trim();
  if (/^0x[0-9a-fA-F]{64}$/.test(trimmed)) {
    return trimmed.toLowerCase();
  }
  if (/^[0-9a-fA-F]{64}$/.test(trimmed)) {
    return `0x${trimmed.toLowerCase()}`;
  }
  return trimmed;
}

export function CexDepositForm({
  config,
  amount,
  onAmountChange,
  onVerified,
  resumeRequest = null,
  onResumeConsumed,
  onVerifyStart,
}: CexDepositFormProps) {
  const [txHash, setTxHash] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [idempotencyKey, setIdempotencyKey] = useState(newIdempotencyKey);
  const [activeTxHash, setActiveTxHash] = useState<string | null>(null);
  const [explorerStatus, setExplorerStatus] =
    useState<ExplorerStatus>("pending");
  const [mismatchAmount, setMismatchAmount] = useState<string | null>(null);
  const [retryPending, setRetryPending] = useState(false);
  const [addressCopied, setAddressCopied] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const mismatchAlertRef = useRef<HTMLDivElement | null>(null);
  const addressCopyStatusRef = useRef<HTMLSpanElement | null>(null);
  const resumeStartedRef = useRef(false);

  const addressExplorer = config.wallet
    ? addressExplorerUrl(config.chainId, config.wallet)
    : null;
  const addressExplorerLabel = explorerName(config.chainId);

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

  useEffect(() => {
    if (!resumeRequest) {
      resumeStartedRef.current = false;
      return;
    }
    if (resumeRequest.method !== "cex") {
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
    setTxHash(hash);
    setIdempotencyKey(key);
    onAmountChange?.(resumeAmount);
    void runVerify(resumeAmount, hash, key, { isRetry: false });
    // Intentionally once per resumeRequest identity; runVerify closes over latest helpers.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- resume gate
  }, [resumeRequest]);

  async function copyPlatformAddress() {
    if (!config.wallet) {
      return;
    }
    try {
      await navigator.clipboard.writeText(config.wallet);
      setAddressCopied(true);
      billingTelemetry.track("deposit_copy_address_clicked", {
        method: "cex",
      });
      addressCopyStatusRef.current?.focus();
      window.setTimeout(() => setAddressCopied(false), 2000);
    } catch {
      setAddressCopied(false);
    }
  }

  async function runVerify(
    amountRequested: string,
    hash: string,
    key: string,
    { isRetry }: { isRetry: boolean },
  ) {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const trimmedAmount = amountRequested.trim();
    const payload = {
      tx_hash: hash,
      amount_requested: trimmedAmount,
      idempotency_key: key,
    };

    onVerifyStart?.();
    savePendingDeposit({
      txHash: hash,
      amount: trimmedAmount,
      idempotencyKey: key,
      method: "cex",
    });

    setIsSubmitting(true);
    setActiveTxHash(hash);
    setExplorerStatus("pending");
    setMismatchAmount(null);
    setError(null);
    setStatusMessage(null);
    billingTelemetry.track("deposit_verify_clicked", {
      method: "cex",
      ...(isRetry ? { retry: true } : {}),
    });
    if (isRetry) {
      billingTelemetry.track("deposit_retry_clicked", { method: "cex" });
    }

    try {
      const deposit = await verifyDepositUntilSettled(
        (body, signal) => verifyCex(body, signal),
        payload,
        {
          signal: controller.signal,
          onUpdate: (current) => {
            if (shouldShowPending(current)) {
              savePendingDeposit({
                txHash: hash,
                amount: trimmedAmount,
                idempotencyKey: key,
                method: "cex",
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
        billingTelemetry.track("deposit_verify_succeeded", { method: "cex" });
        if (isRetry) {
          billingTelemetry.track("deposit_retry_success", { method: "cex" });
        }
        setExplorerStatus("completed");
        setRetryPending(false);
        onVerified(deposit);
        setStatusMessage(depositCopy.cexVerified);
        setIdempotencyKey(newIdempotencyKey());
        setTxHash("");
        return;
      }

      if (isDepositFailed(deposit)) {
        clearPendingDeposit();
        billingTelemetry.track("deposit_verify_failed", {
          method: "cex",
          code: "FAILED",
        });
        setExplorerStatus("failed");
        setError(deposit.failure_reason || depositCopy.cexFailedFallback);
        setIdempotencyKey(newIdempotencyKey());
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
        method: "cex",
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
        // Keep pending session for Continue after timeout / transient errors.
        setError(mapped.message);
      } else {
        clearPendingDeposit();
        setError(mapped.message);
      }
      if (mapped.category !== "pending") {
        setIdempotencyKey(newIdempotencyKey());
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (!isValidDepositAmount(amount, config.decimals)) {
      setError(`Enter a valid amount (max ${config.decimals} decimal places).`);
      return;
    }

    const normalizedHash = normalizeTxHash(txHash);
    if (!/^0x[0-9a-fA-F]{64}$/.test(normalizedHash)) {
      setError("Paste a valid transaction hash (TXID).");
      return;
    }

    await runVerify(amount, normalizedHash, idempotencyKey, { isRetry: false });
  }

  async function handleRetryWithReceived() {
    if (!mismatchAmount || !activeTxHash) {
      return;
    }
    onAmountChange?.(mismatchAmount);
    setRetryPending(true);
    const key = newIdempotencyKey();
    setIdempotencyKey(key);
    setTxHash(activeTxHash);
    await runVerify(mismatchAmount, activeTxHash, key, { isRetry: true });
  }

  const showExplorer =
    Boolean(activeTxHash) && (error || statusMessage || mismatchAmount);

  return (
    <Card as="section" data-testid="deposit-cex-panel">
      <CardSection>
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-lg font-semibold text-slate-900">
            {depositCopy.cexHeading}
          </h2>
          <span
            data-testid="deposit-cex-network-badge"
            className="inline-flex items-center rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-950"
          >
            {depositCopy.cexNetworkBadge}
          </span>
        </div>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          {depositCopy.cexDescription(config.tokenSymbol)}
        </p>

        <div className="mt-5 space-y-4 rounded-xl border border-slate-100 bg-slate-50/80 p-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-sky-700">
              {depositCopy.qrPlatformWalletLabel}
            </p>
            <p
              data-testid="deposit-cex-wallet"
              className="mt-1 break-all font-mono text-sm text-slate-900"
            >
              {config.wallet || "—"}
            </p>
            {config.wallet ? (
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  className="text-sm font-medium text-sky-700 hover:text-sky-800"
                  onClick={() => void copyPlatformAddress()}
                >
                  {addressCopied ? depositCopy.copied : depositCopy.copyAddress}
                </button>
                <span
                  ref={addressCopyStatusRef}
                  tabIndex={-1}
                  className="sr-only"
                  role="status"
                  aria-live="polite"
                >
                  {addressCopied ? depositCopy.copied : ""}
                </span>
                {addressExplorer && addressExplorerLabel ? (
                  <a
                    href={addressExplorer}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-sky-700 underline hover:text-sky-900"
                    onClick={() => {
                      billingTelemetry.track("deposit_explorer_opened", {
                        method: "cex",
                        status: "address",
                      });
                    }}
                  >
                    {depositCopy.cexViewAddressOnExplorer(addressExplorerLabel)}
                  </a>
                ) : null}
              </div>
            ) : null}
          </div>

          <div>
            <p className="text-sm font-medium text-slate-800">
              {depositCopy.cexChecklistTitle}
            </p>
            <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm leading-6 text-slate-700">
              <li>{depositCopy.cexChecklistToken(config.tokenSymbol)}</li>
              <li>{depositCopy.cexChecklistNetwork}</li>
              <li>{depositCopy.cexChecklistWithdraw}</li>
              <li>{depositCopy.cexChecklistPasteTxid}</li>
            </ol>
            <p className="mt-3 text-sm leading-6 text-amber-900">
              {depositCopy.cexAmountNote}
            </p>
          </div>
        </div>

        <form
          className="mt-6 space-y-4"
          onSubmit={(event) => void handleSubmit(event)}
        >
          <label className="block">
            <span className="text-sm font-medium text-slate-700">
              {depositCopy.cexTxHashLabel}
            </span>
            <input
              type="text"
              name="tx_hash"
              autoComplete="off"
              spellCheck={false}
              value={txHash}
              onChange={(event) => setTxHash(event.target.value)}
              placeholder="0x…"
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-mono text-sm text-slate-900 outline-none ring-sky-600 focus:ring-2"
            />
          </label>

          {mismatchAmount ? (
            <div
              ref={mismatchAlertRef}
              tabIndex={-1}
              className="space-y-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-950 outline-none ring-sky-600 focus:ring-2"
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
                  method="cex"
                  status="failed"
                />
              ) : null}
              <button
                type="button"
                disabled={isSubmitting}
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
            <div className="space-y-2">
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
                  method="cex"
                  status={explorerStatus}
                />
              ) : null}
            </div>
          ) : null}
          {statusMessage ? (
            <div className="space-y-2">
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
                  method="cex"
                  status={explorerStatus}
                />
              ) : null}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center justify-center rounded-xl bg-sky-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting
              ? depositCopy.cexVerifying
              : retryPending
                ? depositCopy.cexVerifying
                : depositCopy.cexVerify}
          </button>
        </form>
      </CardSection>
    </Card>
  );
}

function shouldShowPending(deposit: DepositRequest): boolean {
  const status = deposit.status?.trim().toLowerCase();
  return !status || status === "pending";
}
