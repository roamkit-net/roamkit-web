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

import type { Location } from "@/lib/api";
import { locationImageSrc } from "@/lib/api";

const DEBOUNCE_MS = 150;

export type LocationSearchResults = {
  primary: Location[];
  broader: Location[];
};

function locationTextMatches(location: Location, normalizedQuery: string): boolean {
  if (location.title.toLowerCase().includes(normalizedQuery)) {
    return true;
  }
  if (location.slug.toLowerCase().includes(normalizedQuery)) {
    return true;
  }
  const code = location.country_code.toLowerCase();
  if (code && (code === normalizedQuery || code.includes(normalizedQuery))) {
    return true;
  }
  return false;
}

function coversCountry(location: Location, countryCode: string): boolean {
  const normalized = countryCode.toUpperCase();
  if (!normalized) {
    return false;
  }
  return (location.covered_country_codes ?? []).some(
    (code) => code.toUpperCase() === normalized,
  );
}

function sortByTitle(a: Location, b: Location): number {
  return a.title.localeCompare(b.title);
}

export function matchLocations(
  locations: Location[],
  query: string,
): LocationSearchResults {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return { primary: [], broader: [] };
  }

  const primary = locations
    .filter(
      (location) =>
        location.coverage_type === "local" &&
        locationTextMatches(location, normalizedQuery),
    )
    .sort(sortByTitle);

  const primarySlugs = new Set(primary.map((location) => location.slug));
  const matchedCountryCodes = new Set(
    primary
      .map((location) => location.country_code.toUpperCase())
      .filter(Boolean),
  );

  let broader: Location[];

  if (matchedCountryCodes.size > 0) {
    broader = locations
      .filter((location) => {
        if (location.coverage_type === "local") {
          return false;
        }
        if (primarySlugs.has(location.slug)) {
          return false;
        }
        return [...matchedCountryCodes].some((code) =>
          coversCountry(location, code),
        );
      })
      .sort((a, b) => {
        const coverageDiff =
          (a.coverage_type === "regional" ? 0 : 1) -
          (b.coverage_type === "regional" ? 0 : 1);
        if (coverageDiff !== 0) {
          return coverageDiff;
        }
        return sortByTitle(a, b);
      });
  } else {
    broader = locations
      .filter(
        (location) =>
          location.coverage_type !== "local" &&
          locationTextMatches(location, normalizedQuery),
      )
      .sort((a, b) => {
        const coverageDiff =
          (a.coverage_type === "regional" ? 0 : 1) -
          (b.coverage_type === "regional" ? 0 : 1);
        if (coverageDiff !== 0) {
          return coverageDiff;
        }
        return sortByTitle(a, b);
      });
  }

  return { primary, broader };
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M8.5 14.5a6 6 0 1 1 0-12 6 6 0 0 1 0 12Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M13 13 17 17"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ClearIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M6 6 14 14M14 6 6 14"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
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

  const results = useMemo(
    () => matchLocations(locations, debouncedQuery),
    [locations, debouncedQuery],
  );

  const flatSuggestions = useMemo(
    () => [...results.primary, ...results.broader],
    [results.primary, results.broader],
  );

  const showList = open && debouncedQuery.trim().length > 0;
  const hasBroader = results.broader.length > 0;

  function clearQuery() {
    setQuery("");
    setDebouncedQuery("");
    setOpen(false);
    setActiveIndex(-1);
  }

  function selectLocation(location: Location) {
    router.push(`/${location.slug}-esim`);
    clearQuery();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!showList || flatSuggestions.length === 0) {
        return;
      }
      setOpen(true);
      setActiveIndex((current) =>
        current < flatSuggestions.length - 1 ? current + 1 : 0,
      );
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      if (!showList || flatSuggestions.length === 0) {
        return;
      }
      setOpen(true);
      setActiveIndex((current) =>
        current <= 0 ? flatSuggestions.length - 1 : current - 1,
      );
      return;
    }

    if (event.key === "Enter") {
      if (showList && activeIndex >= 0 && flatSuggestions[activeIndex]) {
        event.preventDefault();
        selectLocation(flatSuggestions[activeIndex]);
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

  function renderOption(location: Location, index: number) {
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
        <p className="min-w-0 flex-1 truncate text-sm font-medium text-slate-900">
          {location.title}
        </p>
      </li>
    );
  }

  return (
    <div ref={wrapperRef} className="relative mb-6">
      <label htmlFor={`${listboxId}-input`} className="sr-only">
        Search destinations
      </label>
      <div className="relative">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          id={`${listboxId}-input`}
          type="text"
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
          className="w-full rounded-full border border-slate-200 bg-white py-3 pr-11 pl-10 text-sm text-slate-900 shadow-sm outline-none placeholder:text-slate-400 focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
        />
        {query ? (
          <button
            type="button"
            onClick={clearQuery}
            aria-label="Clear search"
            className="absolute top-1/2 right-2.5 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <ClearIcon className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      {showList ? (
        <ul
          id={listboxId}
          role="listbox"
          aria-label="Destination suggestions"
          className="absolute z-20 mt-2 max-h-80 w-full overflow-auto rounded-2xl border border-slate-200 bg-white py-1 shadow-lg"
        >
          {flatSuggestions.length === 0 ? (
            <li className="px-4 py-3 text-sm text-slate-500">
              No destinations match “{debouncedQuery.trim()}”
            </li>
          ) : (
            <>
              {results.primary.map((location, index) =>
                renderOption(location, index),
              )}
              {hasBroader ? (
                <li
                  role="presentation"
                  className="sticky top-0 bg-slate-50 px-4 py-2 text-xs font-semibold tracking-wide text-slate-500 uppercase"
                >
                  Also available in…
                </li>
              ) : null}
              {results.broader.map((location, index) =>
                renderOption(location, results.primary.length + index),
              )}
            </>
          )}
        </ul>
      ) : null}
    </div>
  );
}
