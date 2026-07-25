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
import { useCallback, useState } from "react";

import { ApiError } from "@/lib/api";
import {
  type DepositInfo,
  type DepositRequest,
  isDepositPendingConfirmations,
  isDepositVerified,
  newIdempotencyKey,
  verifyWalletDeposit,
} from "@/lib/billing";
import { isValidDepositAmount } from "@/lib/eip681";

const ERC20_ABI = [
  "function transfer(address to, uint256 value) returns (bool)",
] as const;

type WalletDepositPanelProps = {
  depositInfo: DepositInfo;
  amount: string;
  onVerified: (deposit: DepositRequest) => void;
};

export function WalletDepositPanel({
  depositInfo,
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

  const verifyHash = useCallback(
    async (hash: string, idempotencyKey: string) => {
      setIsVerifying(true);
      setError(null);
      try {
        const deposit = await verifyWalletDeposit({
          tx_hash: hash,
          amount_requested: amount.trim(),
          idempotency_key: idempotencyKey,
        });

        if (isDepositVerified(deposit)) {
          onVerified(deposit);
          setStatusMessage("Deposit verified. Credits added to your balance.");
          return;
        }

        if (isDepositPendingConfirmations(deposit)) {
          setStatusMessage(
            `Waiting for confirmations (${deposit.confirmations}/${deposit.required_confirmations}). You can tap Verify again shortly.`,
          );
          return;
        }

        if (deposit.status === "pending") {
          setStatusMessage(
            `Transaction submitted. Waiting for ~${depositInfo.min_confirmations} Polygon confirmations.`,
          );
          return;
        }

        setError(
          deposit.failure_reason || "Wallet deposit could not be verified.",
        );
      } catch (err) {
        if (err instanceof ApiError && err.status === 403) {
          setError("WalletConnect deposits are disabled.");
          return;
        }
        if (err instanceof ApiError && err.status === 409) {
          setError(err.message || "This transaction was already credited.");
          return;
        }
        setError(
          err instanceof ApiError
            ? err.message
            : "Unable to verify wallet deposit right now.",
        );
      } finally {
        setIsVerifying(false);
      }
    },
    [amount, depositInfo.min_confirmations, onVerified],
  );

  async function handlePay() {
    setError(null);
    setStatusMessage(null);

    if (!isValidDepositAmount(amount, depositInfo.token_decimals)) {
      setError(
        `Enter a valid amount (max ${depositInfo.token_decimals} decimal places).`,
      );
      return;
    }

    if (!depositInfo.wallet || !depositInfo.contract) {
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
      if (Number(chainId) !== depositInfo.chain_id) {
        await switchNetwork(polygon);
      }

      const provider = new BrowserProvider(walletProvider);
      const signer = await provider.getSigner();
      const token = new Contract(depositInfo.contract, ERC20_ABI, signer);
      const value = parseUnits(amount.trim(), depositInfo.token_decimals);
      const tx = await token.getFunction("transfer")(depositInfo.wallet, value);
      const hash = typeof tx.hash === "string" ? tx.hash : String(tx.hash);

      setStatusMessage(`Transaction sent (${hash.slice(0, 10)}…). Verifying…`);
      await tx.wait();
      await verifyHash(hash, idempotencyKey);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Wallet payment failed.";
      if (/user rejected|denied|rejected the request|ACTION_REJECTED/i.test(message)) {
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
        WalletConnect (Reown AppKit)
      </h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        Connect a wallet and send {depositInfo.token_symbol} on Polygon. After
        you approve the transfer we capture the transaction hash and verify it
        with RoamKit.
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
            ? `Pay ${amount || "…"} ${depositInfo.token_symbol}`
            : "Connect & pay with wallet"}
      </button>
    </section>
  );
}
