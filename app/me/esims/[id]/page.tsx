"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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

function formatMb(value: number | null | undefined): string {
  if (value == null) {
    return "—";
  }
  return `${value} MB`;
}

export default function MyEsimDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const esimId = params.id;

  const [esim, setEsim] = useState<Esim | null>(null);
  const [usage, setUsage] = useState<EsimUsage | null>(null);
  const [topups, setTopups] = useState<TopupPackage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [usageError, setUsageError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshingUsage, setIsRefreshingUsage] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace("/login");
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
          router.replace("/login");
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
  }, [esimId, router]);

  async function refreshUsage() {
    setIsRefreshingUsage(true);
    setUsageError(null);
    try {
      const liveUsage = await fetchMyEsimUsage(esimId);
      setUsage(liveUsage);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        clearTokens();
        router.replace("/login");
        return;
      }
      setUsageError("Could not refresh usage.");
    } finally {
      setIsRefreshingUsage(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-16 text-slate-900">
      <main className="mx-auto w-full max-w-3xl">
        <Link
          href="/me/esims"
          className="text-sm font-medium text-sky-700 hover:text-sky-800"
        >
          ← Back to My eSIMs
        </Link>

        {isLoading ? (
          <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <p className="text-sm text-slate-600">Loading eSIM…</p>
          </div>
        ) : error ? (
          <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
            <p className="font-medium">{error}</p>
          </div>
        ) : esim ? (
          <div className="mt-8 space-y-6">
            <header>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-700">
                {esim.status || "eSIM"}
              </p>
              <h1 className="mt-3 font-mono text-2xl font-bold tracking-tight sm:text-3xl">
                {esim.iccid}
              </h1>
              {esim.lpa ? (
                <p className="mt-3 break-all text-sm text-slate-600">
                  LPA: {esim.lpa}
                </p>
              ) : null}
            </header>

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
                    {esim.direct_apple_installation_url ? (
                      <p>
                        <a
                          href={esim.direct_apple_installation_url}
                          className="font-medium text-sky-700 hover:text-sky-800"
                          target="_blank"
                          rel="noreferrer"
                        >
                          Install on Apple device
                        </a>
                      </p>
                    ) : null}
                    {esim.installation_guide_url ? (
                      <p>
                        <a
                          href={esim.installation_guide_url}
                          className="font-medium text-sky-700 hover:text-sky-800"
                          target="_blank"
                          rel="noreferrer"
                        >
                          Installation guide
                        </a>
                      </p>
                    ) : null}
                  </div>
                </div>
              )}
              {esim.qrcode_installation ? (
                <div
                  className="prose prose-sm mt-4 max-w-none text-slate-700"
                  dangerouslySetInnerHTML={{ __html: esim.qrcode_installation }}
                />
              ) : null}
              {esim.manual_installation ? (
                <div className="mt-4">
                  <h3 className="text-sm font-semibold text-slate-900">
                    Manual installation
                  </h3>
                  <div
                    className="prose prose-sm mt-2 max-w-none text-slate-700"
                    dangerouslySetInnerHTML={{
                      __html: esim.manual_installation,
                    }}
                  />
                </div>
              ) : null}
              {!esim.qrcode_url &&
              !esim.qrcode &&
              !esim.qrcode_installation &&
              !esim.manual_installation ? (
                <p className="mt-3 text-sm text-slate-600">
                  No installation details available yet.
                </p>
              ) : null}
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">
                Available top-ups
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Browse only — purchase arrives in a later phase.
              </p>
              {topups.length === 0 ? (
                <p className="mt-4 text-sm text-slate-600">
                  No top-up packages available.
                </p>
              ) : (
                <ul className="mt-4 divide-y divide-slate-100">
                  {topups.map((topup) => (
                    <li
                      key={topup.id}
                      className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm"
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
                      <p className="font-semibold text-slate-900">
                        ${topup.price_usd}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        ) : null}
      </main>
    </div>
  );
}
