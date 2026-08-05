"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { AppPageHeader } from "@/components/AppPageHeader";
import { AppShell } from "@/components/AppShell";
import { DepositCta } from "@/components/billing/DepositCta";
import { buttonClassName } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Card, CardSection } from "@/components/ui/Card";
import { Empty } from "@/components/ui/Empty";
import { listRowClassName } from "@/components/ui/ListRow";
import { ListSkeleton } from "@/components/ui/ListSkeleton";
import { Badge } from "@/components/ui/Badge";
import {
  ApiError,
  Esim,
  User,
  clearTokens,
  fetchMe,
  fetchMyEsims,
  flagImageUrl,
  isAuthenticated,
} from "@/lib/api";
import {
  esimDestinationLabel,
  esimValidityLabel,
  formatEsimStatus,
  truncateNote,
} from "@/lib/esim/display";
import { needsSetup } from "@/lib/esim/telemetry";
import { loginHref } from "@/lib/navigation/safePath";

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
      router.replace(loginHref("/me/esims"));
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
          router.replace(loginHref("/me/esims"));
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
    <AppShell
      nav={
        <Link
          href="/plans"
          className="text-sm font-medium text-sky-700 hover:text-sky-800"
        >
          ← Browse plans
        </Link>
      }
    >
      <AppPageHeader
        eyebrow={
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-700">
            RoamKit
          </p>
        }
        title={<h1 className="text-3xl font-bold tracking-tight">My eSIMs</h1>}
        description={
          <p className="max-w-2xl text-base leading-7 text-slate-600">
            {user
              ? `Signed in as ${user.email}. Manage your plans and installation.`
              : "Manage your plans and installation."}
          </p>
        }
        actions={
          <div className="flex flex-wrap gap-3">
            <DepositCta returnPath="/me/esims">Deposit credits</DepositCta>
            <Link
              href="/plans"
              className={buttonClassName({
                variant: "secondary",
                size: "sm",
                tone: "app",
              })}
            >
              Browse plans
            </Link>
          </div>
        }
      />

      {isLoading ? (
        <ListSkeleton rows={3} label="Loading your eSIMs…" />
      ) : error ? (
        <Alert variant="warning" title={error} />
      ) : esims.length === 0 ? (
        <Card>
          <CardSection padding="lg">
            <Empty
              title="No eSIMs yet"
              description={
                <>
                  Deposit credits, then buy a plan from the store — or ask an
                  admin to run{" "}
                  <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">
                    create_sandbox_esim
                  </code>{" "}
                  for your account.
                </>
              }
              action={
                <>
                  <DepositCta variant="primary" returnPath="/me/esims">
                    Deposit credits
                  </DepositCta>
                  <Link
                    href="/plans"
                    className={buttonClassName({
                      variant: "secondary",
                      size: "sm",
                      tone: "app",
                    })}
                  >
                    Browse plans
                  </Link>
                </>
              }
            />
          </CardSection>
        </Card>
      ) : (
        <ul className="grid gap-3">
          {esims.map((esim) => {
            const destination = esimDestinationLabel(esim);
            const validity = esimValidityLabel(esim);
            const statusLabel = formatEsimStatus(esim.status);
            const notePreview = truncateNote(esim.note);
            const flagSrc = esim.country_code
              ? flagImageUrl(esim.country_code)
              : null;

            return (
              <li key={esim.id}>
                <Link
                  href={
                    needsSetup(esim)
                      ? `/me/esims/${esim.id}/setup`
                      : `/me/esims/${esim.id}`
                  }
                  className={listRowClassName({ interactive: true })}
                >
                  <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md bg-slate-100">
                    {flagSrc ? (
                      <Image
                        src={flagSrc}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="40px"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs font-semibold uppercase text-slate-400">
                        {destination.slice(0, 2)}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <h2 className="text-base font-semibold text-slate-900">
                        {destination}
                      </h2>
                      {validity ? (
                        <span className="text-sm text-slate-600">
                          {validity}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-0.5 truncate text-sm text-slate-500">
                      {esim.data_allowance
                        ? `${esim.data_allowance} · ${formatUsage(esim)}`
                        : formatUsage(esim)}
                    </p>
                    {notePreview ? (
                      <p className="mt-0.5 truncate text-sm text-slate-500">
                        {notePreview}
                      </p>
                    ) : null}
                  </div>
                  <Badge variant="default" className="shrink-0">
                    {statusLabel}
                  </Badge>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </AppShell>
  );
}
