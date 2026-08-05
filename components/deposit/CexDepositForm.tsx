"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

import { verifyCex } from "@/lib/billing/client";
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

type CexDepositFormProps = {
  config: BillingConfig;
  amount: string;
  onVerified: (deposit: DepositRequest) => void;
};

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
  onVerified,
}: CexDepositFormProps) {
  const [txHash, setTxHash] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [idempotencyKey, setIdempotencyKey] = useState(newIdempotencyKey);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setStatusMessage(null);

    if (!isValidDepositAmount(amount, config.decimals)) {
      setError(
        `Enter a valid amount (max ${config.decimals} decimal places).`,
      );
      return;
    }

    const normalizedHash = normalizeTxHash(txHash);
    if (!/^0x[0-9a-fA-F]{64}$/.test(normalizedHash)) {
      setError("Paste a valid transaction hash (TXID).");
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const payload = {
      tx_hash: normalizedHash,
      amount_requested: amount.trim(),
      idempotency_key: idempotencyKey,
    };

    setIsSubmitting(true);
    billingTelemetry.track("deposit_verify_clicked", { method: "cex" });

    try {
      const deposit = await verifyDepositUntilSettled(
        (body, signal) => verifyCex(body, signal),
        payload,
        {
          signal: controller.signal,
          onUpdate: (current) => {
            if (shouldShowPending(current)) {
              setStatusMessage(
                formatDepositPendingMessage(current, config.confirmations),
              );
            }
          },
        },
      );

      if (isDepositVerified(deposit)) {
        billingTelemetry.track("deposit_verify_succeeded", { method: "cex" });
        onVerified(deposit);
        setStatusMessage(
          "Deposit verified. Credits will appear in your balance.",
        );
        setIdempotencyKey(newIdempotencyKey());
        setTxHash("");
        return;
      }

      if (isDepositFailed(deposit)) {
        billingTelemetry.track("deposit_verify_failed", {
          method: "cex",
          code: "FAILED",
        });
        setError(
          deposit.failure_reason ||
            "Deposit could not be verified. Check the TXID and network.",
        );
        setIdempotencyKey(newIdempotencyKey());
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
        method: "cex",
        code: mapped.code,
        category: mapped.category,
      });
      setError(mapped.message);
      if (mapped.category !== "pending") {
        setIdempotencyKey(newIdempotencyKey());
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">
        {depositCopy.cexHeading}
      </h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        {depositCopy.cexDescription(config.tokenSymbol)}
      </p>

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

        {error ? (
          <p
            className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900"
            role="alert"
          >
            {error}
          </p>
        ) : null}
        {statusMessage ? (
          <p
            className="rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-900"
            role="status"
            aria-live="polite"
          >
            {statusMessage}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center justify-center rounded-xl bg-sky-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? depositCopy.cexVerifying : depositCopy.cexVerify}
        </button>
      </form>
    </section>
  );
}

function shouldShowPending(deposit: DepositRequest): boolean {
  const status = deposit.status?.trim().toLowerCase();
  return !status || status === "pending";
}
