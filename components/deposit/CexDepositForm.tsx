"use client";

import { FormEvent, useState } from "react";

import { ApiError } from "@/lib/api";
import {
  type DepositInfo,
  type DepositRequest,
  isDepositPendingConfirmations,
  isDepositVerified,
  newIdempotencyKey,
  verifyCexDeposit,
} from "@/lib/billing";
import { isValidDepositAmount } from "@/lib/eip681";

type CexDepositFormProps = {
  depositInfo: DepositInfo;
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
  depositInfo,
  amount,
  onVerified,
}: CexDepositFormProps) {
  const [txHash, setTxHash] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [idempotencyKey, setIdempotencyKey] = useState(newIdempotencyKey);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setStatusMessage(null);

    if (!isValidDepositAmount(amount, depositInfo.token_decimals)) {
      setError(
        `Enter a valid amount (max ${depositInfo.token_decimals} decimal places).`,
      );
      return;
    }

    const normalizedHash = normalizeTxHash(txHash);
    if (!/^0x[0-9a-fA-F]{64}$/.test(normalizedHash)) {
      setError("Paste a valid Polygon transaction hash (TXID).");
      return;
    }

    setIsSubmitting(true);
    try {
      const deposit = await verifyCexDeposit({
        tx_hash: normalizedHash,
        amount_requested: amount.trim(),
        idempotency_key: idempotencyKey,
      });

      if (isDepositVerified(deposit)) {
        onVerified(deposit);
        setStatusMessage("Deposit verified. Credits will appear in your balance.");
        setIdempotencyKey(newIdempotencyKey());
        setTxHash("");
        return;
      }

      if (isDepositPendingConfirmations(deposit)) {
        setStatusMessage(
          `Waiting for confirmations (${deposit.confirmations}/${deposit.required_confirmations}). You can submit again with the same TXID.`,
        );
        return;
      }

      if (deposit.status === "pending") {
        setStatusMessage(
          `Deposit is pending. Polygon needs about ${depositInfo.min_confirmations} confirmations.`,
        );
        return;
      }

      setError(
        deposit.failure_reason ||
          "Deposit could not be verified. Check the TXID and network.",
      );
      setIdempotencyKey(newIdempotencyKey());
    } catch (err) {
      if (err instanceof ApiError && err.status === 202) {
        const body = err.body as DepositRequest | undefined;
        if (body && isDepositPendingConfirmations(body)) {
          setStatusMessage(
            `Waiting for confirmations (${body.confirmations}/${body.required_confirmations}). Try again shortly.`,
          );
          return;
        }
        setStatusMessage(
          `Transaction seen but not fully confirmed yet (need ~${depositInfo.min_confirmations}). Try again shortly.`,
        );
        return;
      }
      if (err instanceof ApiError && err.status === 409) {
        setError(err.message || "This transaction was already credited.");
        setIdempotencyKey(newIdempotencyKey());
        return;
      }
      setError(
        err instanceof ApiError
          ? err.message
          : "Unable to verify CEX deposit right now.",
      );
      if (!(err instanceof ApiError) || err.status !== 202) {
        setIdempotencyKey(newIdempotencyKey());
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">
        CEX / manual TXID
      </h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        Withdraw {depositInfo.token_symbol} on <strong>Polygon</strong> from an
        exchange (e.g. MEXC) to the platform wallet, then paste the transaction
        hash here.
      </p>

      <form className="mt-6 space-y-4" onSubmit={(event) => void handleSubmit(event)}>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">
            Transaction hash (TXID)
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
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            {error}
          </p>
        ) : null}
        {statusMessage ? (
          <p className="rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-900">
            {statusMessage}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center justify-center rounded-xl bg-sky-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Verifying…" : "Verify deposit"}
        </button>
      </form>
    </section>
  );
}
