import { cache } from "react";

import {
  ApiError,
  fetchAllPackages,
  fetchLocation,
  type Location,
  type Package,
} from "@/lib/api";

export class LocationUpstreamError extends Error {
  readonly status: number;

  constructor(message = "Catalog upstream error", status = 503) {
    super(message);
    this.name = "LocationUpstreamError";
    this.status = status;
  }
}

export type LocationPageData = {
  location: Location;
  packages: Package[];
};

export type LocationPageResult =
  | { status: "FOUND"; data: LocationPageData }
  | { status: "NOT_FOUND" }
  | { status: "NO_ACTIVE_PLAN" }
  | { status: "UPSTREAM_ERROR"; error: LocationUpstreamError };

export type LocationPageDeps = {
  fetchLocation: (slug: string) => Promise<Location>;
  fetchAllPackages: (options: { location: string }) => Promise<Package[]>;
};

const defaultDeps: LocationPageDeps = {
  fetchLocation,
  fetchAllPackages,
};

function isUsableLocation(value: Location): boolean {
  return typeof value.slug === "string" && value.slug.trim().length > 0;
}

/**
 * Shared decision for generateMetadata + the location page.
 * 404 only after a confirmed missing destination or a successful empty package list.
 */
export async function resolveLocationPage(
  slug: string,
  deps: LocationPageDeps = defaultDeps,
): Promise<LocationPageResult> {
  let location: Location;
  try {
    location = await deps.fetchLocation(slug);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return { status: "NOT_FOUND" };
    }
    const status = error instanceof ApiError ? error.status : 503;
    return {
      status: "UPSTREAM_ERROR",
      error: new LocationUpstreamError(
        error instanceof Error ? error.message : "Location fetch failed",
        status >= 500 ? status : 503,
      ),
    };
  }

  if (!isUsableLocation(location)) {
    return {
      status: "UPSTREAM_ERROR",
      error: new LocationUpstreamError("Invalid location payload"),
    };
  }

  let packages: Package[];
  try {
    packages = await deps.fetchAllPackages({ location: slug });
  } catch (error) {
    const status = error instanceof ApiError ? error.status : 503;
    return {
      status: "UPSTREAM_ERROR",
      error: new LocationUpstreamError(
        error instanceof Error ? error.message : "Packages fetch failed",
        status >= 500 ? status : 503,
      ),
    };
  }

  if (!Array.isArray(packages)) {
    return {
      status: "UPSTREAM_ERROR",
      error: new LocationUpstreamError("Invalid packages payload"),
    };
  }

  if (packages.length === 0) {
    return { status: "NO_ACTIVE_PLAN" };
  }

  return { status: "FOUND", data: { location, packages } };
}

export const loadLocationPage = cache(async (slug: string) =>
  resolveLocationPage(slug),
);
