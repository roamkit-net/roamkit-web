"use client";

import { useMemo, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";

import { LocationCard } from "@/components/LocationCard";
import { PlanCard } from "@/components/PlanCard";
import type { Location, Package } from "@/lib/api";
import { locationImageSrc } from "@/lib/api";

type ServiceType = "data" | "data_calls_texts";
type PlanFilter = "unlimited" | "standard";

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

export function LocationDetail({
  location,
  packages,
}: {
  location: Location;
  packages: Package[];
}) {
  const imageSrc = locationImageSrc(location);
  const operatorTitle = packages[0]?.operator_title ?? null;
  const broader = location.broader_locations ?? [];

  const hasData = packages.some((pkg) => !isDataCallsTexts(pkg));
  const hasDataCallsTexts = packages.some(isDataCallsTexts);
  const showServiceTabs = hasData && hasDataCallsTexts;

  const [serviceType, setServiceType] = useState<ServiceType>(() =>
    hasData ? "data" : "data_calls_texts",
  );
  const [filter, setFilter] = useState<PlanFilter>("unlimited");

  const servicePackages = useMemo(() => {
    if (!showServiceTabs) {
      return packages;
    }
    if (serviceType === "data_calls_texts") {
      return packages.filter(isDataCallsTexts);
    }
    return packages.filter((pkg) => !isDataCallsTexts(pkg));
  }, [packages, serviceType, showServiceTabs]);

  const hasUnlimited = servicePackages.some((pkg) => pkg.is_unlimited);
  const hasStandard = servicePackages.some((pkg) => !pkg.is_unlimited);

  const activeFilter: PlanFilter =
    filter === "unlimited" && !hasUnlimited && hasStandard
      ? "standard"
      : filter === "standard" && !hasStandard && hasUnlimited
        ? "unlimited"
        : filter;

  const filteredPackages = useMemo(() => {
    if (activeFilter === "unlimited") {
      return servicePackages.filter((pkg) => pkg.is_unlimited);
    }
    return servicePackages.filter((pkg) => !pkg.is_unlimited);
  }, [activeFilter, servicePackages]);

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-16 text-slate-900">
      <main className="mx-auto w-full max-w-4xl">
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
            {operatorTitle ? (
              <p className="mt-2 text-base text-slate-600">
                Network: {operatorTitle}
              </p>
            ) : null}
            <a
              href="#compatibility"
              className="mt-3 inline-block text-sm font-medium text-sky-700 hover:text-sky-800"
            >
              Check compatibility
            </a>
          </div>
        </header>

        <section className="mt-10">
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-semibold text-slate-900">Plans</h2>
              {showServiceTabs ? (
                <div className="flex gap-2" role="group" aria-label="Service type">
                  <FilterButton
                    active={serviceType === "data"}
                    onClick={() => setServiceType("data")}
                  >
                    Data
                  </FilterButton>
                  <FilterButton
                    active={serviceType === "data_calls_texts"}
                    onClick={() => setServiceType("data_calls_texts")}
                  >
                    Data / Calls / Texts
                  </FilterButton>
                </div>
              ) : null}
            </div>

            {(hasUnlimited || hasStandard) && (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-medium text-slate-700">
                  Choose your package
                </p>
                <div className="flex gap-2" role="group" aria-label="Data amount">
                  {hasUnlimited ? (
                    <FilterButton
                      active={activeFilter === "unlimited"}
                      onClick={() => setFilter("unlimited")}
                    >
                      Unlimited
                    </FilterButton>
                  ) : null}
                  {hasStandard ? (
                    <FilterButton
                      active={activeFilter === "standard"}
                      onClick={() => setFilter("standard")}
                    >
                      Standard
                    </FilterButton>
                  ) : null}
                </div>
              </div>
            )}
          </div>

          {filteredPackages.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
              <p className="font-medium text-slate-900">No plans in this filter</p>
              <p className="mt-2 text-sm text-slate-600">
                Try another plan type or browse a different destination.
              </p>
            </div>
          ) : (
            <ul className="mt-4 grid gap-4 sm:grid-cols-2">
              {filteredPackages.map((plan) => (
                <li key={plan.id}>
                  <PlanCard plan={plan} />
                </li>
              ))}
            </ul>
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

        <section
          id="compatibility"
          className="mt-14 rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600"
        >
          <h2 className="text-base font-semibold text-slate-900">
            Device compatibility
          </h2>
          <p className="mt-2 leading-6">
            Most recent unlocked iPhones, Google Pixels, and Samsung Galaxy
            devices support eSIM. Confirm your model supports eSIM before
            purchasing.
          </p>
        </section>
      </main>
    </div>
  );
}

function FilterButton({
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
          ? "rounded-lg bg-sky-700 px-3 py-1.5 text-sm font-medium text-white"
          : "rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-200"
      }
    >
      {children}
    </button>
  );
}
