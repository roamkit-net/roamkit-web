"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, Suspense } from "react";

import { AppPageHeader } from "@/components/AppPageHeader";
import { AppShell } from "@/components/AppShell";
import { useBilling } from "@/components/billing/useBilling";
import { CexDepositForm } from "@/components/deposit/CexDepositForm";
import { DepositNetworkWarning } from "@/components/deposit/DepositNetworkWarning";
import { DepositPendingBanner } from "@/components/deposit/DepositPendingBanner";
import { DepositSkeleton } from "@/components/deposit/DepositSkeleton";
import { Eip681QrPanel } from "@/components/deposit/Eip681QrPanel";
import { VoucherRedeemErrorBoundary } from "@/components/deposit/VoucherRedeemErrorBoundary";
import { VoucherRedeemForm } from "@/components/deposit/VoucherRedeemForm";
import { isWalletConnectConfigured } from "@/config/appkit";
import {
  ApiError,
  clearTokens,
  fetchMe,
  isAuthenticated,
} from "@/lib/api";
import { depositCopy } from "@/lib/billing/depositCopy";
import { formatCredits } from "@/lib/billing/format";
import {
  clearPendingDeposit,
  peekPendingDeposit,
  type PendingDepositSession,
} from "@/lib/billing/pendingDeposit";
import { returnDestinationLabel } from "@/lib/billing/returnLabel";
import { billingTelemetry } from "@/lib/billing/telemetry";
import { isValidDepositAmount } from "@/lib/eip681";
import {
  normalizeDepositAmount,
} from "@/lib/orders/insufficientCredits";
import { isSafeReturnPath, loginHref } from "@/lib/navigation/safePath";
import { clearPendingSpend } from "@/lib/orders/pendingSpend";
import { normalizeVoucherCode } from "@/lib/billing/voucherCode";

const WalletDepositWithAppKit = dynamic(
  () =>
    import("@/components/deposit/WalletDepositWithAppKit").then(
      (mod) => mod.WalletDepositWithAppKit,
    ),
  {
    ssr: false,
    loading: () => (
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="animate-pulse space-y-3" aria-hidden="true">
          <div className="h-5 w-48 rounded-lg bg-slate-200/80" />
          <div className="h-4 w-full max-w-md rounded-lg bg-slate-200/80" />
          <div className="h-10 w-40 rounded-lg bg-slate-200/80" />
        </div>
        <span className="sr-only">Loading wallet connector…</span>
      </section>
    ),
  },
);

export default function DepositPage() {
  return (
    <Suspense
      fallback={
        <AppShell>
          <DepositSkeleton />
        </AppShell>
      }
    >
      <DepositPageContent />
    </Suspense>
  );
}

function DepositPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    balance,
    config,
    features,
    isLoading: billingLoading,
    isFetching: billingFetching,
    error: billingError,
    refreshBalance,
  } = useBilling();

  const amountParam = searchParams.get("amount");
  const returnParam = searchParams.get("return");
  const codeParam = searchParams.get("code");
  /** Capture once — URL `code` is stripped before deposit-info finishes loading. */
  const [voucherPrefill] = useState(() =>
    codeParam ? normalizeVoucherCode(codeParam) : undefined,
  );
  const returnPath =
    returnParam && isSafeReturnPath(returnParam) ? returnParam : null;
  const returnLabel = returnPath
    ? returnDestinationLabel(returnPath)
    : null;

  const [amount, setAmount] = useState(() => {
    if (amountParam && isValidDepositAmount(amountParam, 6)) {
      return normalizeDepositAmount(amountParam);
    }
    return "25";
  });
  const [userError, setUserError] = useState<string | null>(null);
  const [userLoading, setUserLoading] = useState(true);
  const [returning, setReturning] = useState(false);
  const [bannerSession, setBannerSession] =
    useState<PendingDepositSession | null>(null);
  const [resumeRequest, setResumeRequest] =
    useState<PendingDepositSession | null>(null);

  useEffect(() => {
    billingTelemetry.track("deposit_page_open");
  }, []);

  useEffect(() => {
    setBannerSession(peekPendingDeposit());
  }, []);

  useEffect(() => {
    if (amountParam && isValidDepositAmount(amountParam, 6)) {
      setAmount(normalizeDepositAmount(amountParam));
    }
  }, [amountParam]);

  const handleResumeConsumed = useCallback(() => {
    setResumeRequest(null);
  }, []);

  const handleVerifyStart = useCallback(() => {
    setBannerSession(null);
  }, []);

  const handlePendingContinue = useCallback(() => {
    const session = peekPendingDeposit();
    if (!session) {
      setBannerSession(null);
      return;
    }
    billingTelemetry.track("deposit_pending_resumed", {
      method: session.method,
    });
    setBannerSession(null);
    setResumeRequest(session);
  }, []);

  const handlePendingDismiss = useCallback(() => {
    clearPendingDeposit();
    setBannerSession(null);
    setResumeRequest(null);
  }, []);

  useEffect(() => {
    if (!codeParam) {
      return;
    }
    const params = new URLSearchParams(searchParams.toString());
    params.delete("code");
    const qs = params.toString();
    const href = qs ? `/me/deposit?${qs}` : "/me/deposit";
    // Prefer history API so the query is stripped even if App Router
    // soft-navigation is delayed; prefill is already captured in state.
    window.history.replaceState(window.history.state, "", href);
    router.replace(href, { scroll: false });
  }, [codeParam, router, searchParams]);

  useEffect(() => {
    const depositNext = `/me/deposit${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;
    if (!isAuthenticated()) {
      router.replace(loginHref(depositNext));
      return;
    }

    let cancelled = false;

    async function loadUser() {
      setUserLoading(true);
      setUserError(null);
      try {
        await fetchMe();
        if (!cancelled) {
          setUserError(null);
        }
      } catch (err) {
        if (cancelled) {
          return;
        }
        if (err instanceof ApiError && err.status === 401) {
          clearTokens();
          router.replace(loginHref(depositNext));
          return;
        }
        setUserError("Unable to load your account right now.");
      } finally {
        if (!cancelled) {
          setUserLoading(false);
        }
      }
    }

    void loadUser();
    return () => {
      cancelled = true;
    };
  }, [router, searchParams]);

  const handleVerified = useCallback(async () => {
    try {
      await refreshBalance();
    } catch {
      // Balance refresh is best-effort after a successful verify.
    }
    if (returnPath) {
      setReturning(true);
      router.push(returnPath);
    }
  }, [refreshBalance, returnPath, router]);

  const isLoading = userLoading || billingLoading;
  const showWallet =
    features.walletConnect && isWalletConnectConfigured() && Boolean(config);
  const balanceRefreshing =
    !billingLoading && billingFetching && balance != null;

  return (
    <AppShell
      nav={
        <Link
          href={returnPath ?? "/me/esims"}
          onClick={() => clearPendingSpend()}
          className="text-sm font-medium text-sky-700 hover:text-sky-800"
        >
          ← {returnPath ? `Back to ${returnLabel}` : "My eSIMs"}
        </Link>
      }
    >
      <AppPageHeader
        eyebrow={
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-700">
            RoamKit
          </p>
        }
        title={
          <h1 className="text-3xl font-bold tracking-tight">
            {depositCopy.pageTitle}
          </h1>
        }
        description={
          <p className="max-w-2xl text-base leading-7 text-slate-600">
            {features.walletConnect
              ? depositCopy.pageDescriptionWithWallet
              : depositCopy.pageDescriptionWithoutWallet}
          </p>
        }
      >
        {returnPath && returnLabel ? (
          <div className="flex max-w-2xl flex-wrap items-center justify-between gap-3 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2.5 text-sm text-sky-900">
            <p>
              {returning
                ? `Deposit confirmed — returning to ${returnLabel}…`
                : `After a successful deposit you will return to ${returnLabel}.`}
            </p>
            {!returning ? (
              <Link
                href={returnPath}
                onClick={() => clearPendingSpend()}
                className="shrink-0 font-semibold text-sky-800 underline hover:text-sky-950"
              >
                Continue without depositing
              </Link>
            ) : null}
          </div>
        ) : null}
      </AppPageHeader>

        {returning ? (
          <div
            className="rounded-2xl border border-sky-200 bg-sky-50 p-6 text-sky-950"
            role="status"
            aria-live="polite"
          >
            <p className="font-medium">
              Credits updated. Taking you back to {returnLabel}…
            </p>
            <p className="mt-2 text-sm text-sky-800">
              Your purchase will retry automatically.
            </p>
          </div>
        ) : null}

        {isLoading ? (
          <DepositSkeleton />
        ) : userError ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
            <p className="font-medium">{userError}</p>
          </div>
        ) : !features.billingEnabled ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <p className="text-lg font-medium text-slate-900">
              Billing is unavailable
            </p>
            <p className="mt-2 text-sm text-slate-600">
              Prepaid credits are not enabled in this environment yet.
            </p>
          </div>
        ) : billingError || !config ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
            <p className="font-medium">
              {billingError?.message ||
                "Unable to load deposit details right now."}
            </p>
          </div>
        ) : (
          <div className={`space-y-6 ${returning ? "opacity-60" : ""}`}>
            <DepositNetworkWarning
              tokenSymbol={config.tokenSymbol}
              chainId={config.chainId}
            />

            {bannerSession ? (
              <DepositPendingBanner
                session={bannerSession}
                chainId={config.chainId}
                onContinue={handlePendingContinue}
                onDismiss={handlePendingDismiss}
              />
            ) : null}

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-sky-700">
                  Credit balance
                  {balanceRefreshing ? (
                    <span className="ml-2 font-medium normal-case tracking-normal text-slate-400">
                      Updating…
                    </span>
                  ) : null}
                </p>
                <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 tabular-nums">
                  {balance != null ? formatCredits(balance) : "—"}{" "}
                  <span className="text-lg font-semibold text-slate-500">
                    {config.tokenSymbol}
                  </span>
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
                    {config.tokenSymbol}
                  </span>
                </div>
                <p
                  id="deposit-amount-hint"
                  className="mt-1.5 text-xs text-slate-500"
                >
                  Up to {config.decimals} decimal places. Used for QR
                  {features.walletConnect ? ", wallet pay," : ""} and exchange
                  verification.
                </p>
              </label>
            </section>

            {features.vouchers ? (
              <VoucherRedeemErrorBoundary>
                <VoucherRedeemForm
                  enabled
                  initialCode={voucherPrefill}
                  tokenSymbol={config.tokenSymbol}
                  refreshBalance={refreshBalance}
                />
              </VoucherRedeemErrorBoundary>
            ) : null}

            <Eip681QrPanel config={config} amount={amount} />

            {showWallet ? (
              <WalletDepositWithAppKit
                config={config}
                amount={amount}
                onAmountChange={setAmount}
                onVerified={() => void handleVerified()}
                resumeRequest={
                  resumeRequest?.method === "wallet" ? resumeRequest : null
                }
                onResumeConsumed={handleResumeConsumed}
                onVerifyStart={handleVerifyStart}
              />
            ) : features.walletConnect ? (
              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900">
                  {depositCopy.walletMisconfiguredHeading}
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {depositCopy.walletMisconfiguredBody}
                </p>
              </section>
            ) : null}

            <CexDepositForm
              config={config}
              amount={amount}
              onAmountChange={setAmount}
              onVerified={() => void handleVerified()}
              resumeRequest={
                resumeRequest?.method === "cex" ? resumeRequest : null
              }
              onResumeConsumed={handleResumeConsumed}
              onVerifyStart={handleVerifyStart}
            />
          </div>
        )}
    </AppShell>
  );
}
