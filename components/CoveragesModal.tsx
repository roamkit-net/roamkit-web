"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import Image from "next/image";

import type { CoverageNetwork, LocationCoverage } from "@/lib/api";
import { flagImageUrl } from "@/lib/api";

const NETWORK_TYPE_RANK: Record<string, number> = {
  "5G": 3,
  LTE: 2,
  "4G": 2,
  "3G": 1,
};

export function highestNetworkType(types: string[]): string | null {
  let best: string | null = null;
  let bestRank = -1;
  for (const type of types) {
    const normalized = type.trim().toUpperCase();
    const rank = NETWORK_TYPE_RANK[normalized] ?? 0;
    if (rank > bestRank) {
      bestRank = rank;
      best = normalized === "4G" ? "LTE" : normalized;
    }
  }
  return best;
}

function NetworkTypeBadge({ type }: { type: string }) {
  return (
    <span className="inline-flex items-center rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-700">
      {type}
    </span>
  );
}

function NetworkTypes({ types }: { types: string[] }) {
  const highest = highestNetworkType(types);
  if (!highest) return null;
  return <NetworkTypeBadge type={highest} />;
}

function flattenNetworks(coverages: LocationCoverage[]): CoverageNetwork[] {
  const networks: CoverageNetwork[] = [];
  for (const coverage of coverages) {
    for (const network of coverage.networks ?? []) {
      networks.push(network);
    }
  }
  return networks;
}

/** Resolve a display name when Airalo sends name === ISO2 code (e.g. "AD"). */
export function coverageCountryLabel(coverage: LocationCoverage): string {
  const code = coverage.code?.toUpperCase();
  const name = coverage.name?.trim() ?? "";
  if (code && (!name || name.toUpperCase() === code)) {
    return new Intl.DisplayNames(["en"], { type: "region" }).of(code) ?? code;
  }
  return name || code || "";
}

export function CoveragesSummary({
  coverages,
  coverageType,
}: {
  coverages: LocationCoverage[];
  coverageType: "local" | "regional" | "global";
}) {
  const [open, setOpen] = useState(false);
  const networks = useMemo(() => flattenNetworks(coverages), [coverages]);

  if (coverages.length === 0) {
    return null;
  }

  const isLocal = coverageType === "local";

  if (isLocal) {
    const primary = networks[0];
    if (!primary) return null;
    const others = networks.length - 1;
    const canOpen = networks.length > 1;

    return (
      <>
        <button
          type="button"
          onClick={canOpen ? () => setOpen(true) : undefined}
          disabled={!canOpen}
          className={
            canOpen
              ? "mt-3 inline-flex max-w-full items-center gap-2 text-left text-sm text-slate-700 hover:text-sky-800"
              : "mt-3 inline-flex max-w-full items-center gap-2 text-left text-sm text-slate-700"
          }
        >
          <span aria-hidden className="text-base leading-none">
            📶
          </span>
          <span className="truncate font-medium">{primary.name}</span>
          <NetworkTypes types={primary.types} />
          {others > 0 ? (
            <span className="shrink-0 text-slate-500">
              +{others} other{others === 1 ? "" : "s"}
            </span>
          ) : null}
        </button>
        {open ? (
          <CoveragesModal
            mode="networks"
            coverages={coverages}
            onClose={() => setOpen(false)}
          />
        ) : null}
      </>
    );
  }

  const count = coverages.length;
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-3 inline-flex max-w-full items-center gap-2 text-left text-sm font-medium text-sky-700 hover:text-sky-800"
      >
        <span aria-hidden className="text-base leading-none">
          🌐
        </span>
        <span>
          {count} {count === 1 ? "Country and Network" : "Countries and Networks"}
        </span>
      </button>
      {open ? (
        <CoveragesModal
          mode="countries"
          coverages={coverages}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </>
  );
}

export function CoveragesModal({
  mode,
  coverages,
  onClose,
}: {
  mode: "networks" | "countries";
  coverages: LocationCoverage[];
  onClose: () => void;
}) {
  const titleId = useId();
  const searchId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    closeRef.current?.focus();
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  const networks = useMemo(() => flattenNetworks(coverages), [coverages]);

  const sortedCountries = useMemo(() => {
    return [...coverages].sort((a, b) =>
      coverageCountryLabel(a).localeCompare(coverageCountryLabel(b), undefined, {
        sensitivity: "base",
      }),
    );
  }, [coverages]);

  const filteredCountries = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return sortedCountries;
    return sortedCountries.filter((coverage) => {
      const label = coverageCountryLabel(coverage).toLowerCase();
      const code = (coverage.code ?? "").toLowerCase();
      const name = (coverage.name ?? "").toLowerCase();
      return (
        label.includes(normalized) ||
        code.includes(normalized) ||
        name.includes(normalized)
      );
    });
  }, [query, sortedCountries]);

  const title = mode === "networks" ? "Networks" : "Countries + Networks";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0 bg-slate-900/40"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 flex max-h-[85vh] w-full max-w-lg flex-col rounded-t-2xl bg-white shadow-xl sm:rounded-2xl"
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 id={titleId} className="text-lg font-semibold text-slate-900">
            {title}
          </h2>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-sm font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-800"
          >
            Close
          </button>
        </div>

        {mode === "countries" ? (
          <div className="border-b border-slate-100 px-5 py-3">
            <label htmlFor={searchId} className="sr-only">
              Search by country
            </label>
            <input
              id={searchId}
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by country"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none ring-sky-500 placeholder:text-slate-400 focus:ring-2"
            />
          </div>
        ) : null}

        <div className="overflow-y-auto px-5 py-3">
          {mode === "networks" ? (
            <ul className="divide-y divide-slate-100">
              {networks.map((network) => (
                <li
                  key={network.name}
                  className="flex items-center justify-between gap-3 py-3"
                >
                  <span className="font-medium text-slate-900">
                    {network.name}
                  </span>
                  <NetworkTypes types={network.types} />
                </li>
              ))}
            </ul>
          ) : filteredCountries.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">
              No countries match your search.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {filteredCountries.map((coverage) => (
                <li
                  key={coverage.code || coverage.name}
                  className="flex items-start justify-between gap-3 py-3"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    {coverage.code ? (
                      <span className="relative h-5 w-7 shrink-0 overflow-hidden rounded-sm bg-slate-100">
                        <Image
                          src={flagImageUrl(coverage.code)}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="28px"
                        />
                      </span>
                    ) : null}
                    <span className="truncate font-medium text-slate-900">
                      {coverageCountryLabel(coverage)}
                    </span>
                  </div>
                  <div className="flex max-w-[55%] flex-wrap justify-end gap-x-2 gap-y-1 text-right">
                    {(coverage.networks ?? []).map((network) => (
                      <span
                        key={network.name}
                        className="inline-flex items-center gap-1 text-xs text-slate-600"
                      >
                        <span>{network.name}</span>
                        <NetworkTypes types={network.types} />
                      </span>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
