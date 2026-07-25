"use client";

import { useMemo, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";

import { AuthNav } from "@/components/AuthNav";
import { DepositCta } from "@/components/billing/DepositCta";
import { CompatibilityButton } from "@/components/CompatibilityButton";
import { CoveragesSummary } from "@/components/CoveragesModal";
import { LocationCard } from "@/components/LocationCard";
import { useBuyPackage } from "@/components/orders/useBuyPackage";
import { PackageRow } from "@/components/PackageRow";
import type { Location, Package } from "@/lib/api";
import { locationImageSrc } from "@/lib/api";
import {
  filterPackagesByPlan,
  resolveActivePlanFilter,
  shouldShowPlanFilter,
  type PlanFilter,
  type ServiceType,
} from "@/lib/planFilters";

function isDataCallsTexts(pkg: Package): boolean {
  if ((pkg.voice_minutes ?? 0) > 0 || (pkg.text_sms ?? 0) > 0) {
    return true;
  }
  // Airalo marks DCT operators as e.g. "data-voice-text" even when voice/text
  // numeric fields are absent until a fresh sync.
  const planType = (pkg.plan_type || "data").toLowerCase();
  if (planType === "data" || planType === "topup") {
    return false;
  }
  return (
    planType.includes("voice") ||
    planType.includes("text") ||
    planType.includes("call")
  );
}

function coverageLabel(coverageType: Location["coverage_type"]): string {
  if (coverageType === "local") return "Local";
  if (coverageType === "regional") return "Regional";
  return "Global";
}

function formatValidityHeading(days: number): string {
  if (days === 1) {
    return "1 day";
  }
  return `${days} days`;
}

function comparePackages(a: Package, b: Package): number {
  if (a.validity_days !== b.validity_days) {
    return a.validity_days - b.validity_days;
  }
  return Number.parseFloat(a.price_usd) - Number.parseFloat(b.price_usd);
}

export function LocationDetail({
  location,
  packages,
}: {
  location: Location;
  packages: Package[];
}) {
  const imageSrc = locationImageSrc(location);
  const coverages = location.coverages ?? [];
  const broader = location.broader_locations ?? [];

  const hasData = packages.some((pkg) => !isDataCallsTexts(pkg));
  const hasDataCallsTexts = packages.some(isDataCallsTexts);
  const showServiceTabs = hasData && hasDataCallsTexts;

  const [serviceType, setServiceType] = useState<ServiceType>(() =>
    hasData ? "data" : "data_calls_texts",
  );
  const [filter, setFilter] = useState<PlanFilter>("unlimited");
  const {
    buy,
    busyPackageId,
    error: buyError,
    isRetrying,
    clearError,
  } = useBuyPackage();

  const servicePackages = useMemo(() => {
    if (!showServiceTabs) {
      return packages;
    }
    if (serviceType === "data_calls_texts") {
      return packages.filter(isDataCallsTexts);
    }
    return packages.filter((pkg) => !isDataCallsTexts(pkg));
  }, [packages, serviceType, showServiceTabs]);

  // Data + both Unlimited/Standard only — never under Data / Calls / Texts.
  const showPlanFilter = shouldShowPlanFilter(servicePackages, serviceType);
  const activeFilter = resolveActivePlanFilter(filter, servicePackages);

  const filteredPackages = useMemo(
    () =>
      filterPackagesByPlan(
        servicePackages,
        activeFilter,
        serviceType,
      ) as Package[],
    [activeFilter, servicePackages, serviceType],
  );

  const { mostPopular, dayGroups } = useMemo(() => {
    const sorted = [...filteredPackages].sort(comparePackages);
    if (sorted.length === 0) {
      return { mostPopular: null as Package | null, dayGroups: [] as { days: number; packages: Package[] }[] };
    }

    const popular = sorted.reduce((cheapest, pkg) =>
      Number.parseFloat(pkg.price_usd) < Number.parseFloat(cheapest.price_usd)
        ? pkg
        : cheapest,
    );

    const remaining = sorted.filter((pkg) => pkg.id !== popular.id);
    const groups: { days: number; packages: Package[] }[] = [];
    for (const pkg of remaining) {
      const last = groups[groups.length - 1];
      if (last && last.days === pkg.validity_days) {
        last.packages.push(pkg);
      } else {
        groups.push({ days: pkg.validity_days, packages: [pkg] });
      }
    }

    return { mostPopular: popular, dayGroups: groups };
  }, [filteredPackages]);

  const plansHeading = showServiceTabs
    ? null
    : hasDataCallsTexts
      ? "Data / Calls / Texts"
      : "Data";

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-16 text-slate-900">
      <main className="mx-auto w-full max-w-4xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <nav className="text-sm text-slate-500">
            <Link href="/plans" className="font-medium text-sky-700 hover:text-sky-800">
              Store
            </Link>
            <span className="mx-2">/</span>
            <Link
              href={`/plans?tab=${location.coverage_type}`}
              className="font-medium text-sky-700 hover:text-sky-800"
            >
              {coverageLabel(location.coverage_type)}
            </Link>
            <span className="mx-2">/</span>
            <span className="text-slate-700">{location.title}</span>
          </nav>
          <AuthNav />
        </div>

        <header className="mt-8 flex flex-wrap items-start gap-5">
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full bg-slate-100">
            {imageSrc ? (
              <Image
                src={imageSrc}
                alt=""
                fill
                className="object-cover"
                sizes="64px"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm font-semibold uppercase text-slate-400">
                {location.title.slice(0, 2)}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-700">
              RoamKit
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">
              {location.title} eSIMs
            </h1>
            <CoveragesSummary
              coverages={coverages}
              coverageType={location.coverage_type}
            />
            <CompatibilityButton />
          </div>
        </header>

        <section className="mt-10">
          <div className="flex flex-col gap-4">
            {showServiceTabs ? (
              <div
                className="flex gap-8 border-b border-slate-200"
                role="tablist"
                aria-label="Service type"
              >
                <ServiceTab
                  active={serviceType === "data"}
                  onClick={() => setServiceType("data")}
                >
                  Data
                </ServiceTab>
                <ServiceTab
                  active={serviceType === "data_calls_texts"}
                  onClick={() => setServiceType("data_calls_texts")}
                >
                  Data / Calls / Texts
                </ServiceTab>
              </div>
            ) : (
              <h2 className="border-b border-slate-200 pb-3 text-xl font-semibold text-slate-900">
                {plansHeading}
              </h2>
            )}

            {showPlanFilter ? (
              <div
                className="inline-flex w-fit rounded-full bg-slate-200/90 p-1"
                role="group"
                aria-label="Data amount"
              >
                <SegmentButton
                  active={activeFilter === "unlimited"}
                  onClick={() => setFilter("unlimited")}
                >
                  Unlimited
                </SegmentButton>
                <SegmentButton
                  active={activeFilter === "standard"}
                  onClick={() => setFilter("standard")}
                >
                  Standard
                </SegmentButton>
              </div>
            ) : null}

            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-medium text-slate-700">
                Choose your package
              </p>
              <DepositCta variant="link">Need credits? Deposit →</DepositCta>
            </div>
          </div>

          {isRetrying ? (
            <div className="mt-4 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
              Completing your purchase after deposit…
            </div>
          ) : null}
          {buyError ? (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <p>{buyError}</p>
              <button
                type="button"
                onClick={clearError}
                className="font-medium text-amber-950 underline"
              >
                Dismiss
              </button>
            </div>
          ) : null}

          {filteredPackages.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
              <p className="font-medium text-slate-900">No plans in this filter</p>
              <p className="mt-2 text-sm text-slate-600">
                Try another plan type or browse a different destination.
              </p>
            </div>
          ) : (
            <div className="mt-4 flex flex-col gap-6">
              {mostPopular ? (
                <div>
                  <h3 className="mb-2 text-sm font-semibold text-slate-700">
                    Most Popular
                  </h3>
                  <PackageRow
                    plan={mostPopular}
                    showValidity
                    onBuy={(pkg) => void buy(pkg.id)}
                    isBuying={busyPackageId === mostPopular.id}
                    buyDisabled={busyPackageId !== null}
                  />
                </div>
              ) : null}
              {dayGroups.map((group) => (
                <div key={group.days}>
                  <h3 className="mb-2 text-sm font-semibold text-slate-700">
                    {formatValidityHeading(group.days)}
                  </h3>
                  <ul className="flex flex-col gap-3">
                    {group.packages.map((plan) => (
                      <li key={plan.id}>
                        <PackageRow
                          plan={plan}
                          onBuy={(pkg) => void buy(pkg.id)}
                          isBuying={busyPackageId === plan.id}
                          buyDisabled={busyPackageId !== null}
                        />
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </section>

        {broader.length > 0 ? (
          <section className="mt-14">
            <h2 className="text-xl font-semibold text-slate-900">
              Need broader coverage?
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Regional and global plans that include {location.title}.
            </p>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {broader.map((item) => (
                <li key={item.slug}>
                  <LocationCard location={item} />
                </li>
              ))}
            </ul>
          </section>
        ) : null}

      </main>
    </div>
  );
}

function ServiceTab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={
        active
          ? "-mb-px border-b-2 border-slate-900 pb-3.5 text-[15px] font-semibold tracking-tight text-slate-900 outline-none focus-visible:outline-none"
          : "-mb-px border-b-2 border-transparent pb-3.5 text-[15px] font-medium tracking-tight text-slate-400 outline-none transition-colors hover:text-slate-700 focus-visible:outline-none focus-visible:text-slate-700"
      }
    >
      {children}
    </button>
  );
}

function SegmentButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white outline-none focus-visible:outline-none"
          : "rounded-full px-5 py-2 text-sm font-medium text-slate-700 outline-none transition-colors hover:text-slate-900 focus-visible:outline-none"
      }
    >
      {children}
    </button>
  );
}
