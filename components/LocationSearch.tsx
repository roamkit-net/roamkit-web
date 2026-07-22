"use client";

import Image from "next/image";
import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { useRouter } from "next/navigation";

import type { Location, LocationCoverageType } from "@/lib/api";
import { locationImageSrc } from "@/lib/api";

const COVERAGE_ORDER: Record<LocationCoverageType, number> = {
  local: 0,
  regional: 1,
  global: 2,
};

const MAX_SUGGESTIONS = 8;
const DEBOUNCE_MS = 150;

function formatFromPrice(priceUsd: string | null): string {
  if (!priceUsd) {
    return "See plans";
  }
  const amount = Number.parseFloat(priceUsd);
  if (Number.isNaN(amount)) {
    return `from ${priceUsd}`;
  }
  return `from ${new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount)}`;
}

function locationMatches(location: Location, normalizedQuery: string): boolean {
  if (location.title.toLowerCase().includes(normalizedQuery)) {
    return true;
  }
  if (location.slug.toLowerCase().includes(normalizedQuery)) {
    return true;
  }
  const code = location.country_code.toLowerCase();
  if (code === normalizedQuery || code.includes(normalizedQuery)) {
    return true;
  }
  return false;
}

export function matchLocations(locations: Location[], query: string): Location[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return [];
  }

  return locations
    .filter((location) => locationMatches(location, normalizedQuery))
    .sort((a, b) => {
      const coverageDiff =
        COVERAGE_ORDER[a.coverage_type] - COVERAGE_ORDER[b.coverage_type];
      if (coverageDiff !== 0) {
        return coverageDiff;
      }
      return a.title.localeCompare(b.title);
    });
}

export function LocationSearch({
  locations,
  onDebouncedQueryChange,
}: {
  locations: Location[];
  onDebouncedQueryChange?: (query: string) => void;
}) {
  const router = useRouter();
  const listboxId = useId();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      setDebouncedQuery(query);
    }, DEBOUNCE_MS);
    return () => window.clearTimeout(handle);
  }, [query]);

  useEffect(() => {
    onDebouncedQueryChange?.(debouncedQuery);
  }, [debouncedQuery, onDebouncedQueryChange]);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setActiveIndex(-1);
      }
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  const suggestions = useMemo(
    () => matchLocations(locations, debouncedQuery).slice(0, MAX_SUGGESTIONS),
    [locations, debouncedQuery],
  );

  const showList = open && debouncedQuery.trim().length > 0;

  function selectLocation(location: Location) {
    router.push(`/${location.slug}-esim`);
    setQuery("");
    setDebouncedQuery("");
    setOpen(false);
    setActiveIndex(-1);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!showList || suggestions.length === 0) {
        return;
      }
      setOpen(true);
      setActiveIndex((current) =>
        current < suggestions.length - 1 ? current + 1 : 0,
      );
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      if (!showList || suggestions.length === 0) {
        return;
      }
      setOpen(true);
      setActiveIndex((current) =>
        current <= 0 ? suggestions.length - 1 : current - 1,
      );
      return;
    }

    if (event.key === "Enter") {
      if (showList && activeIndex >= 0 && suggestions[activeIndex]) {
        event.preventDefault();
        selectLocation(suggestions[activeIndex]);
      }
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      setActiveIndex(-1);
    }
  }

  const activeOptionId =
    showList && activeIndex >= 0
      ? `${listboxId}-option-${activeIndex}`
      : undefined;

  return (
    <div ref={wrapperRef} className="relative mb-6">
      <label htmlFor={`${listboxId}-input`} className="sr-only">
        Search destinations
      </label>
      <input
        id={`${listboxId}-input`}
        type="search"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={showList}
        aria-controls={listboxId}
        aria-activedescendant={activeOptionId}
        autoComplete="off"
        placeholder="Search countries and regions…"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
          setActiveIndex(-1);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none placeholder:text-slate-400 focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
      />

      {showList ? (
        <ul
          id={listboxId}
          role="listbox"
          aria-label="Destination suggestions"
          className="absolute z-20 mt-2 max-h-80 w-full overflow-auto rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
        >
          {suggestions.length === 0 ? (
            <li className="px-4 py-3 text-sm text-slate-500">
              No destinations match “{debouncedQuery.trim()}”
            </li>
          ) : (
            suggestions.map((location, index) => {
              const imageSrc = locationImageSrc(location);
              const isActive = index === activeIndex;
              return (
                <li
                  key={location.slug}
                  id={`${listboxId}-option-${index}`}
                  role="option"
                  aria-selected={isActive}
                  className={
                    isActive
                      ? "flex cursor-pointer items-center gap-3 bg-sky-50 px-3 py-2.5"
                      : "flex cursor-pointer items-center gap-3 px-3 py-2.5 hover:bg-slate-50"
                  }
                  onMouseEnter={() => setActiveIndex(index)}
                  onMouseDown={(event) => {
                    event.preventDefault();
                    selectLocation(location);
                  }}
                >
                  <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-slate-100">
                    {imageSrc ? (
                      <Image
                        src={imageSrc}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="36px"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[10px] font-semibold uppercase text-slate-400">
                        {location.title.slice(0, 2)}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900">
                      {location.title}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {formatFromPrice(location.min_price_usd)}
                    </p>
                  </div>
                </li>
              );
            })
          )}
        </ul>
      ) : null}
    </div>
  );
}
