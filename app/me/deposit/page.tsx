"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { CexDepositForm } from "@/components/deposit/CexDepositForm";
import { Eip681QrPanel } from "@/components/deposit/Eip681QrPanel";
import { UserMenu } from "@/components/UserMenu";
import { isWalletConnectConfigured } from "@/config/appkit";
import { ApiError, User, clearTokens, fetchMe, isAuthenticated } from "@/lib/api";
import {
  type DepositInfo,
  fetchBillingBalance,
  fetchDepositInfo,
  formatBalance,
} from "@/lib/billing";

const WalletDepositWithAppKit = dynamic(
  () =>
    import("@/components/deposit/WalletDepositWithAppKit").then(
      (mod) => mod.WalletDepositWithAppKit,
    ),
  {
    ssr: false,
    loading: () => (
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-600">Loading wallet connector…</p>
      </section>
    ),
  },
);

export default function DepositPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [depositInfo, setDepositInfo] = useState<DepositInfo | null>(null);
  const [amount, setAmount] = useState("25");
  const [error, setError] = useState<string | null>(null);
  const [billingDisabled, setBillingDisabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const refreshBalance = useCallback(async () => {
    const result = await fetchBillingBalance();
    setBalance(result.balance);
  }, []);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace("/login");
      return;
    }

    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);
      setBillingDisabled(false);
      try {
        const me = await fetchMe();
        if (cancelled) {
          return;
        }
        setUser(me);

        const [balanceResult, info] = await Promise.all([
          fetchBillingBalance(),
          fetchDepositInfo(),
        ]);
        if (cancelled) {
          return;
        }
        setBalance(balanceResult.balance);
        setDepositInfo(info);
      } catch (err) {
        if (cancelled) {
          return;
        }
        if (err instanceof ApiError && err.status === 401) {
          clearTokens();
          router.replace("/login");
          return;
        }
        if (err instanceof ApiError && err.status === 404) {
          setBillingDisabled(true);
          setError(null);
          return;
        }
        setError(
          err instanceof ApiError
            ? "Unable to load deposit details right now."
            : "Something went wrong while loading deposit details.",
        );
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [router]);

  async function handleVerified() {
    try {
      await refreshBalance();
    } catch {
      // Balance refresh is best-effort after a successful verify.
    }
  }

  const showWallet =
    Boolean(depositInfo?.walletconnect_enabled) && isWalletConnectConfigured();

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-16 text-slate-900">
      <main className="mx-auto w-full max-w-4xl">
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <Link
              href="/me/esims"
              className="text-sm font-medium text-sky-700 hover:text-sky-800"
            >
              ← My eSIMs
            </Link>
            <p className="mt-4 text-sm font-semibold uppercase tracking-[0.2em] text-sky-700">
              RoamKit
            </p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight">Deposit</h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
              Add prepaid credits with Polygon USDT. Send on-chain via QR /
              WalletConnect, or paste a CEX withdrawal TXID.
            </p>
          </div>
          {user ? (
            <UserMenu email={user.email} />
          ) : (
            <span
              className="inline-flex h-10 w-10 rounded-full bg-slate-200"
              aria-hidden="true"
            />
          )}
        </div>

        {isLoading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <p className="text-sm text-slate-600">Loading deposit details…</p>
          </div>
        ) : billingDisabled ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <p className="text-lg font-medium text-slate-900">
              Billing is unavailable
            </p>
            <p className="mt-2 text-sm text-slate-600">
              Prepaid credits are not enabled in this environment yet.
            </p>
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
            <p className="font-medium">{error}</p>
          </div>
        ) : depositInfo ? (
          <div className="space-y-6">
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-sky-700">
                    Credit balance
                  </p>
                  <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                    {balance != null ? formatBalance(balance) : "—"}{" "}
                    <span className="text-lg font-semibold text-slate-500">
                      {depositInfo.token_symbol}
                    </span>
                  </p>
                </div>
                <p className="max-w-sm text-sm leading-6 text-amber-800">
                  <strong>USDT on Polygon only.</strong> Other networks or tokens
                  will not be credited.
                </p>
              </div>

              <label className="mt-6 block max-w-xs">
                <span className="text-sm font-medium text-slate-700">
                  Amount to deposit
                </span>
                <div className="mt-1.5 flex items-center gap-2">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none ring-sky-600 focus:ring-2"
                    aria-describedby="deposit-amount-hint"
                  />
                  <span className="text-sm font-medium text-slate-600">
                    {depositInfo.token_symbol}
                  </span>
                </div>
                <p id="deposit-amount-hint" className="mt-1.5 text-xs text-slate-500">
                  Up to {depositInfo.token_decimals} decimal places. Used for QR,
                  wallet pay, and CEX verification.
                </p>
              </label>
            </section>

            <Eip681QrPanel depositInfo={depositInfo} amount={amount} />

            {showWallet ? (
              <WalletDepositWithAppKit
                depositInfo={depositInfo}
                amount={amount}
                onVerified={() => void handleVerified()}
              />
            ) : depositInfo.walletconnect_enabled ? (
              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900">
                  WalletConnect
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Wallet deposits are enabled on the API, but{" "}
                  <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">
                    NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID
                  </code>{" "}
                  is not configured for this web build. Use the EIP-681 QR or CEX
                  TXID flow instead.
                </p>
              </section>
            ) : (
              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900">
                  WalletConnect
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  In-app wallet deposits are disabled. Use the EIP-681 QR or paste
                  a CEX transaction hash below.
                </p>
              </section>
            )}

            <CexDepositForm
              depositInfo={depositInfo}
              amount={amount}
              onVerified={() => void handleVerified()}
            />
          </div>
        ) : null}
      </main>
    </div>
  );
}
