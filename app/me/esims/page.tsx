"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { AuthNav } from "@/components/AuthNav";
import { DepositCta } from "@/components/billing/DepositCta";
import { ListSkeleton } from "@/components/ui/ListSkeleton";
import {
  ApiError,
  Esim,
  User,
  clearTokens,
  fetchMe,
  fetchMyEsims,
  isAuthenticated,
} from "@/lib/api";

function formatUsage(esim: Esim): string {
  if (esim.usage_is_unlimited) {
    return "Unlimited";
  }
  if (esim.usage_remaining_mb == null || esim.usage_total_mb == null) {
    return "Usage not synced";
  }
  return `${esim.usage_remaining_mb} / ${esim.usage_total_mb} MB`;
}

export default function MyEsimsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [esims, setEsims] = useState<Esim[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace("/login");
      return;
    }

    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const [me, list] = await Promise.all([fetchMe(), fetchMyEsims()]);
        if (cancelled) {
          return;
        }
        setUser(me);
        setEsims(list.results);
      } catch (err) {
        if (cancelled) {
          return;
        }
        if (err instanceof ApiError && err.status === 401) {
          clearTokens();
          router.replace("/login");
          return;
        }
        setError(
          err instanceof ApiError
            ? "Unable to load your eSIMs right now."
            : "Something went wrong while loading your eSIMs.",
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

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-16 text-slate-900">
      <main className="mx-auto w-full max-w-4xl">
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <Link
              href="/plans"
              className="text-sm font-medium text-sky-700 hover:text-sky-800"
            >
              ← Browse plans
            </Link>
            <p className="mt-4 text-sm font-semibold uppercase tracking-[0.2em] text-sky-700">
              RoamKit
            </p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight">My eSIMs</h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
              {user
                ? `Signed in as ${user.email}. View ICCID, QR, and installation details.`
                : "View ICCID, QR, and installation details for your eSIMs."}
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <DepositCta returnPath="/me/esims">Deposit credits</DepositCta>
              <Link
                href="/plans"
                className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
              >
                Browse plans
              </Link>
            </div>
          </div>
          <AuthNav />
        </div>

        {isLoading ? (
          <ListSkeleton rows={3} label="Loading your eSIMs…" />
        ) : error ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
            <p className="font-medium">{error}</p>
          </div>
        ) : esims.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <p className="text-lg font-medium text-slate-900">No eSIMs yet</p>
            <p className="mt-2 text-sm text-slate-600">
              Deposit credits, then buy a plan from the store — or ask an admin
              to run{" "}
              <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">
                create_sandbox_esim
              </code>{" "}
              for your account.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <DepositCta variant="primary" returnPath="/me/esims">
                Deposit credits
              </DepositCta>
              <Link
                href="/plans"
                className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
              >
                Browse plans
              </Link>
            </div>
          </div>
        ) : (
          <ul className="grid gap-4">
            {esims.map((esim) => (
              <li key={esim.id}>
                <Link
                  href={`/me/esims/${esim.id}`}
                  className="block rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-sky-300 hover:shadow-md"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-sky-700">
                        {esim.status || "eSIM"}
                      </p>
                      <h2 className="mt-2 font-mono text-lg font-semibold text-slate-900">
                        {esim.iccid}
                      </h2>
                      <p className="mt-1 text-sm text-slate-600">
                        Usage: {formatUsage(esim)}
                      </p>
                    </div>
                    <span className="text-sm font-medium text-sky-700">
                      View details →
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
