"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { AppPageHeader } from "@/components/AppPageHeader";
import { AppShell } from "@/components/AppShell";
import { DepositCta } from "@/components/billing/DepositCta";
import { LocationCard } from "@/components/LocationCard";
import {
  LocationSearch,
  matchLocations,
} from "@/components/LocationSearch";
import type { Location, LocationListType } from "@/lib/api";
import { selectPopularLocations } from "@/lib/popular/ranking";
import { recordPopularRankingMeta } from "@/lib/popular/telemetry";

const TABS: { id: LocationListType; label: string }[] = [
  { id: "popular", label: "Popular" },
  { id: "local", label: "Local" },
  { id: "regional", label: "Regional" },
  { id: "global", label: "Global" },
  { id: "all", label: "All" },
];

const TAB_COPY: Record<
  LocationListType,
  { title: string; description: string }
> = {
  popular: {
    title: "Popular destinations",
    description: "Top places travelers pick first — stay online from day one.",
  },
  local: {
    title: "Local eSIMs",
    description: "Country-specific plans with local coverage where you land.",
  },
  regional: {
    title: "Regional eSIMs",
    description: "One plan across multiple countries in the same region.",
  },
  global: {
    title: "Global eSIMs",
    description: "Worldwide coverage for multi-stop trips and frequent flyers.",
  },
  all: {
    title: "All destinations",
    description: "Browse every location in the RoamKit catalog.",
  },
};

function isLocationListType(value: string | null): value is LocationListType {
  return (
    value === "popular" ||
    value === "local" ||
    value === "regional" ||
    value === "global" ||
    value === "all"
  );
}

function filterLocations(
  locations: Location[],
  tab: LocationListType,
): Location[] {
  if (tab === "all") {
    return locations;
  }
  return locations.filter((location) => location.coverage_type === tab);
}

export function PlansStore({
  locations,
  errorMessage,
  initialTab,
  viewerCountry = null,
  geoRankingEnabled = true,
}: {
  locations: Location[];
  errorMessage: string | null;
  initialTab: LocationListType;
  viewerCountry?: string | null;
  geoRankingEnabled?: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const activeTab = isLocationListType(tabParam) ? tabParam : initialTab;
  const copy = TAB_COPY[activeTab];
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const trimmedQuery = debouncedQuery.trim();
  const isSearching = trimmedQuery.length > 0;
  const searchResults = useMemo(
    () => (isSearching ? matchLocations(locations, trimmedQuery) : null),
    [locations, isSearching, trimmedQuery],
  );
  const popularSelection = useMemo(
    () =>
      selectPopularLocations({
        locations,
        viewerCountry,
        geoRankingEnabled,
      }),
    [locations, viewerCountry, geoRankingEnabled],
  );
  const visibleLocations = useMemo(() => {
    if (searchResults) {
      return [...searchResults.primary, ...searchResults.broader];
    }
    if (activeTab === "popular") {
      return popularSelection.locations;
    }
    return filterLocations(locations, activeTab);
  }, [locations, activeTab, searchResults, popularSelection]);

  useEffect(() => {
    if (activeTab !== "popular" || isSearching) {
      return;
    }
    recordPopularRankingMeta({
      ranking_source: popularSelection.ranking_source,
      viewer_country: viewerCountry,
    });
  }, [
    activeTab,
    isSearching,
    popularSelection.ranking_source,
    viewerCountry,
  ]);

  function selectTab(tab: LocationListType) {
    const params = new URLSearchParams(searchParams.toString());
    if (tab === "popular") {
      params.delete("tab");
    } else {
      params.set("tab", tab);
    }
    const query = params.toString();
    router.push(query ? `/plans?${query}` : "/plans", { scroll: false });
  }

  return (
    <AppShell>
      <AppPageHeader
        eyebrow={
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-700">
            RoamKit Store
          </p>
        }
        title={
          <h1 className="text-3xl font-bold tracking-tight">{copy.title}</h1>
        }
        description={
          <p className="max-w-2xl text-base leading-7 text-slate-600">
            {copy.description}
          </p>
        }
        actions={
          <DepositCta returnPath="/plans" variant="link">
            Need credits? Deposit →
          </DepositCta>
        }
      />

        <LocationSearch
          locations={locations}
          onDebouncedQueryChange={setDebouncedQuery}
        />

        <div
          className="mb-8 flex flex-wrap gap-2 border-b border-slate-200 pb-4"
          role="tablist"
          aria-label="Destination types"
        >
          {TABS.map((tab) => {
            const isActive = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => selectTab(tab.id)}
                className={
                  isActive
                    ? "rounded-lg bg-sky-700 px-3 py-1.5 text-sm font-medium text-white"
                    : "rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-200"
                }
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {errorMessage ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
            <p className="font-medium">{errorMessage}</p>
            <p className="mt-2 text-sm">
              Ensure the API is running and packages have been synced.
            </p>
          </div>
        ) : visibleLocations.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            {isSearching ? (
              <>
                <p className="text-lg font-medium text-slate-900">
                  No destinations match “{trimmedQuery}”
                </p>
                <p className="mt-2 text-sm text-slate-600">
                  Try another country, region, or ISO code.
                </p>
              </>
            ) : (
              <>
                <p className="text-lg font-medium text-slate-900">
                  No destinations available yet
                </p>
                <p className="mt-2 text-sm text-slate-600">
                  Run a package sync on the API to populate the catalog.
                </p>
              </>
            )}
          </div>
        ) : searchResults ? (
          <div className="space-y-8">
            {searchResults.primary.length > 0 ? (
              <ul className="grid gap-3 sm:grid-cols-2">
                {searchResults.primary.map((location) => (
                  <li key={location.slug}>
                    <LocationCard location={location} />
                  </li>
                ))}
              </ul>
            ) : null}
            {searchResults.broader.length > 0 ? (
              <div>
                {searchResults.primary.length > 0 ? (
                  <p className="mb-3 text-xs font-semibold tracking-wide text-slate-500 uppercase">
                    Also available in…
                  </p>
                ) : null}
                <ul className="grid gap-3 sm:grid-cols-2">
                  {searchResults.broader.map((location) => (
                    <li key={location.slug}>
                      <LocationCard location={location} />
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {visibleLocations.map((location) => (
              <li key={location.slug}>
                <LocationCard location={location} />
              </li>
            ))}
          </ul>
        )}
    </AppShell>
  );
}
