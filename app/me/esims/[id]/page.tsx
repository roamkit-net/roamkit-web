"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { AppShell } from "@/components/AppShell";
import { DepositCta } from "@/components/billing/DepositCta";
import { useBilling } from "@/components/billing/useBilling";
import { CatalogPriceDisplay } from "@/components/CatalogPriceDisplay";
import { EsimNoteForm } from "@/components/esim/EsimNoteForm";
import { ManualInstallTips } from "@/components/esim/ManualInstallTips";
import {
  dataLabelFromPackage,
  PurchaseConfirmDialog,
  validityLabelFromDays,
} from "@/components/orders/PurchaseConfirmDialog";
import { usePurchaseTopup } from "@/components/orders/usePurchaseTopup";
import { Alert } from "@/components/ui/Alert";
import { DetailSkeleton } from "@/components/ui/ListSkeleton";
import {
  ApiError,
  Esim,
  EsimUsage,
  TopupPackage,
  clearTokens,
  fetchMyEsim,
  fetchMyEsimTopups,
  fetchMyEsimUsage,
  isAuthenticated,
} from "@/lib/api";
import {
  canUseAppleInstallLink,
  detectInstallDevice,
  type InstallDeviceClass,
} from "@/lib/esim/device";
import {
  esimDestinationLabel,
  esimNote,
  formatEsimDateTime,
  formatEsimStatus,
} from "@/lib/esim/display";
import {
  activationPolicyMessage,
  createEsimTelemetry,
  createSetupSessionId,
  needsSetup,
} from "@/lib/esim/telemetry";
import { billingTelemetry } from "@/lib/billing/telemetry";
import { hasSufficientCredits } from "@/lib/orders/canAfford";
import { loginHref } from "@/lib/navigation/safePath";

function formatMb(value: number | null | undefined): string {
  if (value == null) {
    return "—";
  }
  return `${value} MB`;
}

const INSUFFICIENT_CREDITS_TITLE =
  "Not enough credits — deposit to buy this plan";

function currentPathWithSearch(): string {
  if (typeof window === "undefined") {
    return "/";
  }
  return `${window.location.pathname}${window.location.search}`;
}

export default function MyEsimDetailPage() {
  const router = useRouter();
  const { balance } = useBilling();
  const params = useParams<{ id: string }>();
  const esimId = params.id;
  const detailPath = `/me/esims/${esimId}`;

  const [esim, setEsim] = useState<Esim | null>(null);
  const [usage, setUsage] = useState<EsimUsage | null>(null);
  const [topups, setTopups] = useState<TopupPackage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [usageError, setUsageError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshingUsage, setIsRefreshingUsage] = useState(false);
  const [device, setDevice] = useState<InstallDeviceClass>("desktop");
  const installSessionId = useRef(createSetupSessionId());
  const installTelemetry = useMemo(
    () => createEsimTelemetry(esimId, installSessionId.current),
    [esimId],
  );

  useEffect(() => {
    setDevice(detectInstallDevice());
  }, []);

  const {
    purchase,
    busyPackageId,
    error: purchaseError,
    successTopup,
    isRetrying,
    clearError: clearPurchaseError,
    clearSuccess,
  } = usePurchaseTopup(esimId);

  const [pendingTopup, setPendingTopup] = useState<TopupPackage | null>(null);
  const returnFocusRef = useRef<HTMLButtonElement | null>(null);
  const purchaseAttemptedRef = useRef(false);

  useEffect(() => {
    if (!purchaseAttemptedRef.current) {
      return;
    }
    if (busyPackageId !== null) {
      return;
    }
    setPendingTopup(null);
    purchaseAttemptedRef.current = false;
  }, [busyPackageId]);

  function topupBuyTitle(topup: TopupPackage): string | undefined {
    if (hasSufficientCredits(balance, topup.price_usd) === false) {
      return INSUFFICIENT_CREDITS_TITLE;
    }
    return undefined;
  }

  function topupBuyDisabled(topup: TopupPackage): boolean {
    if (hasSufficientCredits(balance, topup.price_usd) === false) {
      return true;
    }
    if (pendingTopup !== null) {
      return true;
    }
    if (busyPackageId !== null) {
      return true;
    }
    return false;
  }

  function handleTopupBuyClick(
    topup: TopupPackage,
    buyButton: HTMLButtonElement,
  ) {
    if (!isAuthenticated()) {
      router.push(loginHref(currentPathWithSearch()));
      return;
    }
    returnFocusRef.current = buyButton;
    purchaseAttemptedRef.current = false;
    billingTelemetry.track("purchase_confirm_opened", {
      kind: "topup",
      packageId: topup.id,
      esimId: String(esimId),
    });
    setPendingTopup(topup);
  }

  function handleConfirmTopup() {
    if (!pendingTopup) {
      return;
    }
    if (purchaseAttemptedRef.current || busyPackageId !== null) {
      return;
    }
    purchaseAttemptedRef.current = true;
    billingTelemetry.track("purchase_confirm_confirmed", {
      kind: "topup",
      packageId: pendingTopup.id,
      esimId: String(esimId),
    });
    void purchase(pendingTopup.id);
  }

  function handleCancelTopup() {
    if (busyPackageId !== null) {
      return;
    }
    if (pendingTopup) {
      billingTelemetry.track("purchase_confirm_cancelled", {
        kind: "topup",
        packageId: pendingTopup.id,
        esimId: String(esimId),
      });
    }
    setPendingTopup(null);
    purchaseAttemptedRef.current = false;
  }

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace(loginHref(detailPath));
      return;
    }

    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);
      setUsageError(null);
      try {
        const [detail, topupList] = await Promise.all([
          fetchMyEsim(esimId),
          fetchMyEsimTopups(esimId),
        ]);
        if (cancelled) {
          return;
        }
        setEsim(detail);
        setTopups(topupList.results);

        try {
          const liveUsage = await fetchMyEsimUsage(esimId);
          if (!cancelled) {
            setUsage(liveUsage);
          }
        } catch {
          if (!cancelled) {
            setUsageError("Live usage is unavailable right now.");
          }
        }
      } catch (err) {
        if (cancelled) {
          return;
        }
        if (err instanceof ApiError && err.status === 401) {
          clearTokens();
          router.replace(loginHref(detailPath));
          return;
        }
        if (err instanceof ApiError && err.status === 404) {
          setError("eSIM not found.");
        } else {
          setError("Unable to load this eSIM right now.");
        }
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
  }, [detailPath, esimId, router]);

  useEffect(() => {
    if (!successTopup) {
      return;
    }
    let cancelled = false;
    async function refreshAfterTopup() {
      try {
        const [topupList, liveUsage] = await Promise.all([
          fetchMyEsimTopups(esimId),
          fetchMyEsimUsage(esimId).catch(() => null),
        ]);
        if (cancelled) {
          return;
        }
        setTopups(topupList.results);
        if (liveUsage) {
          setUsage(liveUsage);
        }
      } catch {
        // Listing refresh is best-effort after purchase.
      }
    }
    void refreshAfterTopup();
    return () => {
      cancelled = true;
    };
  }, [esimId, successTopup]);

  async function refreshUsage() {
    setIsRefreshingUsage(true);
    setUsageError(null);
    try {
      const liveUsage = await fetchMyEsimUsage(esimId);
      setUsage(liveUsage);
    } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          clearTokens();
          router.replace(loginHref(detailPath));
          return;
        }
        setUsageError("Could not refresh usage.");
      } finally {
        setIsRefreshingUsage(false);
      }
    }

  const returnPath = `/me/esims/${esimId}`;

  return (
    <AppShell
      maxWidth="3xl"
      nav={
        <Link
          href="/me/esims"
          className="text-sm font-medium text-sky-700 hover:text-sky-800"
        >
          ← Back to My eSIMs
        </Link>
      }
    >
        {isLoading ? (
          <DetailSkeleton label="Loading eSIM…" />
        ) : error ? (
          <Alert variant="warning" title={error} />
        ) : esim ? (
          <div className="space-y-6">
            <header>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-700">
                {formatEsimStatus(esim.status)}
              </p>
              <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
                {esimDestinationLabel(esim)}
              </h1>
              {esim.location_title?.trim() && esim.package_title?.trim() ? (
                <p className="mt-2 text-sm text-slate-600">
                  {esim.package_title}
                </p>
              ) : null}
              {needsSetup(esim) ? (
                <p className="mt-4">
                  <Link
                    href={`/me/esims/${esimId}/setup`}
                    className="inline-flex rounded-lg bg-sky-700 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-800"
                  >
                    Continue setup
                  </Link>
                </p>
              ) : null}
              <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
                {activationPolicyMessage(esim.activation_policy)}
              </p>
            </header>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">
                eSIM details
              </h2>
              <dl className="mt-4 space-y-3 text-sm">
                {esim.data_allowance ? (
                  <div className="flex flex-wrap justify-between gap-2">
                    <dt className="text-slate-500">Data</dt>
                    <dd className="font-medium text-slate-900">
                      {esim.data_allowance}
                    </dd>
                  </div>
                ) : null}
                {esim.validity_days != null ? (
                  <div className="flex flex-wrap justify-between gap-2">
                    <dt className="text-slate-500">Validity</dt>
                    <dd className="font-medium text-slate-900">
                      {esim.validity_days === 1
                        ? "1 day"
                        : `${esim.validity_days} days`}
                    </dd>
                  </div>
                ) : null}
                {esim.paid_usd != null && esim.paid_usd !== "" ? (
                  <div className="flex flex-wrap justify-between gap-2">
                    <dt className="text-slate-500">Paid</dt>
                    <dd className="font-medium text-slate-900">
                      <CatalogPriceDisplay amount={esim.paid_usd} />
                    </dd>
                  </div>
                ) : null}
                <div className="flex flex-wrap justify-between gap-2">
                  <dt className="text-slate-500">Issued at</dt>
                  <dd className="font-medium text-slate-900">
                    {formatEsimDateTime(esim.issued_at ?? esim.created_at)}
                  </dd>
                </div>
                <div className="flex flex-wrap justify-between gap-2">
                  <dt className="text-slate-500">Activated at</dt>
                  <dd className="font-medium text-slate-900">
                    {formatEsimDateTime(esim.activated_at)}
                  </dd>
                </div>
                <div className="flex flex-wrap justify-between gap-2">
                  <dt className="text-slate-500">ICCID</dt>
                  <dd className="font-mono font-medium text-slate-900">
                    {esim.iccid}
                  </dd>
                </div>
                {esim.lpa ? (
                  <div className="flex flex-wrap justify-between gap-2">
                    <dt className="text-slate-500">LPA</dt>
                    <dd className="max-w-[70%] break-all text-right font-medium text-slate-900">
                      {esim.lpa}
                    </dd>
                  </div>
                ) : null}
              </dl>
            </section>

            <EsimNoteForm
              key={esimId}
              esimId={esimId}
              savedNote={esimNote(esim)}
              onSaved={(id, note) =>
                setEsim((current) =>
                  current && String(current.id) === String(id)
                    ? { ...current, note }
                    : current,
                )
              }
            />

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-slate-900">Usage</h2>
                <button
                  type="button"
                  onClick={() => void refreshUsage()}
                  disabled={isRefreshingUsage}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                >
                  {isRefreshingUsage ? "Refreshing…" : "Refresh"}
                </button>
              </div>
              {usageError ? (
                <p className="mt-3 text-sm text-amber-800">{usageError}</p>
              ) : null}
              {usage ? (
                <dl className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
                  <div>
                    <dt className="text-slate-500">Status</dt>
                    <dd className="font-medium text-slate-900">{usage.status}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Remaining</dt>
                    <dd className="font-medium text-slate-900">
                      {usage.is_unlimited
                        ? "Unlimited"
                        : formatMb(usage.remaining_mb)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Total</dt>
                    <dd className="font-medium text-slate-900">
                      {usage.is_unlimited
                        ? "Unlimited"
                        : formatMb(usage.total_mb)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Expires</dt>
                    <dd className="font-medium text-slate-900">
                      {usage.expired_at ?? "—"}
                    </dd>
                  </div>
                </dl>
              ) : (
                <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <dt className="text-slate-500">Cached remaining</dt>
                    <dd className="font-medium text-slate-900">
                      {esim.usage_is_unlimited
                        ? "Unlimited"
                        : formatMb(esim.usage_remaining_mb)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Cached total</dt>
                    <dd className="font-medium text-slate-900">
                      {esim.usage_is_unlimited
                        ? "Unlimited"
                        : formatMb(esim.usage_total_mb)}
                    </dd>
                  </div>
                </dl>
              )}
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">
                Installation
              </h2>
              {(esim.qrcode_url || esim.qrcode) && (
                <div className="mt-4 flex flex-col items-start gap-4 sm:flex-row">
                  {esim.qrcode_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={esim.qrcode_url}
                      alt={`QR code for eSIM ${esim.iccid}`}
                      className="h-48 w-48 rounded-lg border border-slate-200 bg-white object-contain p-2"
                    />
                  ) : null}
                  <div className="space-y-2 text-sm text-slate-600">
                    {esim.matching_id ? (
                      <p>
                        Matching ID:{" "}
                        <span className="font-mono text-slate-900">
                          {esim.matching_id}
                        </span>
                      </p>
                    ) : null}
                    {canUseAppleInstallLink(device) &&
                    esim.direct_apple_installation_url ? (
                      <p>
                        <a
                          href={esim.direct_apple_installation_url}
                          className="font-medium text-sky-700 hover:text-sky-800"
                          target="_blank"
                          rel="noreferrer"
                          onClick={() =>
                            installTelemetry.track(
                              "install.apple_install_clicked",
                            )
                          }
                        >
                          Install on Apple device
                        </a>
                      </p>
                    ) : null}
                    {esimId ? (
                      <p>
                        <Link
                          href={`/me/esims/${esimId}/setup`}
                          className="font-medium text-sky-700 hover:text-sky-800"
                        >
                          Open setup guide
                        </Link>
                      </p>
                    ) : null}
                  </div>
                </div>
              )}
              {!(esim.qrcode_url || esim.qrcode) && esimId ? (
                <p className="mt-4 text-sm text-slate-600">
                  <Link
                    href={`/me/esims/${esimId}/setup`}
                    className="font-medium text-sky-700 hover:text-sky-800"
                  >
                    Open setup guide
                  </Link>
                </p>
              ) : null}
              {esim.lpa || esim.matching_id ? (
                <ManualInstallTips
                  className="mt-4"
                  lpa={esim.lpa}
                  matchingId={esim.matching_id}
                />
              ) : null}
              {!esim.qrcode_url &&
              !esim.qrcode &&
              !esim.lpa &&
              !esim.matching_id &&
              !esim.direct_apple_installation_url ? (
                <p className="mt-3 text-sm text-slate-600">
                  No installation details available yet.
                </p>
              ) : null}
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    Available top-ups
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Purchase with prepaid credits. Insufficient balance opens
                    deposit, then returns here to retry.
                  </p>
                </div>
                <DepositCta returnPath={returnPath} variant="secondary">
                  Deposit credits
                </DepositCta>
              </div>
              {isRetrying ? (
                <p className="mt-3 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-900">
                  Completing your top-up after deposit…
                </p>
              ) : null}
              {successTopup ? (
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
                  <p>
                    Top-up purchased
                    {successTopup.amount ? (
                      <>
                        {" "}
                        (
                        <CatalogPriceDisplay amount={successTopup.amount} />)
                      </>
                    ) : null}
                    .
                  </p>
                  <button
                    type="button"
                    onClick={clearSuccess}
                    className="font-medium underline"
                  >
                    Dismiss
                  </button>
                </div>
              ) : null}
              {purchaseError ? (
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                  <p>{purchaseError}</p>
                  <button
                    type="button"
                    onClick={clearPurchaseError}
                    className="font-medium underline"
                  >
                    Dismiss
                  </button>
                </div>
              ) : null}
              {topups.length === 0 ? (
                <p className="mt-4 text-sm text-slate-600">
                  No top-up packages available.
                </p>
              ) : (
                <ul className="mt-4 divide-y divide-slate-100">
                  {topups.map((topup) => (
                    <li
                      key={topup.id}
                      className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm"
                    >
                      <div>
                        <p className="font-medium text-slate-900">
                          {topup.title}
                        </p>
                        <p className="text-slate-600">
                          {topup.is_unlimited
                            ? "Unlimited"
                            : topup.data_allowance}{" "}
                          · {topup.validity_days} days
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="font-semibold text-slate-900">
                          <CatalogPriceDisplay amount={topup.price_usd} />
                        </p>
                        <button
                          type="button"
                          onClick={(event) =>
                            handleTopupBuyClick(topup, event.currentTarget)
                          }
                          disabled={topupBuyDisabled(topup)}
                          title={topupBuyTitle(topup)}
                          aria-label={topupBuyTitle(topup)}
                          className="inline-flex min-h-11 items-center rounded-lg bg-sky-700 px-3 py-1.5 text-sm font-semibold text-white hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {busyPackageId === topup.id ? "Buying…" : "Buy"}
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        ) : null}
        {pendingTopup ? (
          <PurchaseConfirmDialog
            summary={{
              title: pendingTopup.title,
              dataLabel: dataLabelFromPackage(pendingTopup),
              validityLabel: validityLabelFromDays(pendingTopup.validity_days),
              priceUsd: pendingTopup.price_usd,
            }}
            isPurchasing={busyPackageId === pendingTopup.id}
            onCancel={handleCancelTopup}
            onConfirm={handleConfirmTopup}
            returnFocusRef={returnFocusRef}
          />
        ) : null}
    </AppShell>
  );
}
