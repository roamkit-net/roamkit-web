import type { Metadata } from "next";

import type { Location, Package } from "@/lib/api";
import { locationEsimPath, routes } from "@/lib/routes";

import { isSeoIndexingEnabled } from "./indexing";
import { canonicalUrl, PRODUCTION_ORIGIN } from "./origin";

export const noIndexRobots = { index: false, follow: false } as const;

export const noIndexMetadata: Metadata = {
  robots: noIndexRobots,
};

export function rootRobots(
  env: NodeJS.ProcessEnv = process.env,
): Metadata["robots"] {
  if (isSeoIndexingEnabled(env)) {
    return { index: true, follow: true };
  }
  return noIndexRobots;
}

export function homeMetadata(): Metadata {
  const url = canonicalUrl(routes.home);
  return {
    alternates: { canonical: url },
    openGraph: { url },
  };
}

export function plansMetadata(): Metadata {
  const url = canonicalUrl(routes.plans);
  const title = "eSIM plans — RoamKit.net";
  const description =
    "Browse local, regional, and global eSIM data plans on RoamKit.net.";
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: "RoamKit.net",
      type: "website",
    },
  };
}

function coveragePhrase(coverageType: Location["coverage_type"]): string {
  if (coverageType === "local") {
    return "Local coverage";
  }
  if (coverageType === "regional") {
    return "Regional coverage";
  }
  return "Worldwide coverage";
}

export function locationSeoDescription(
  location: Location,
  packages: Pick<Package, "price_usd" | "validity_days">[] = [],
): string {
  const coverage = coveragePhrase(location.coverage_type);
  if (packages.length === 0) {
    if (location.min_price_usd) {
      return `${location.title} eSIM data plans on RoamKit.net. ${coverage}. From $${location.min_price_usd}.`;
    }
    return `${location.title} eSIM data plans on RoamKit.net. ${coverage}.`;
  }

  const prices = packages
    .map((pkg) => Number.parseFloat(pkg.price_usd))
    .filter((price) => Number.isFinite(price) && price >= 0);
  const validities = [
    ...new Set(
      packages
        .map((pkg) => pkg.validity_days)
        .filter((days) => Number.isFinite(days) && days > 0),
    ),
  ].sort((a, b) => a - b);
  const planLabel = packages.length === 1 ? "plan" : "plans";
  const price =
    prices.length > 0 ? ` from $${Math.min(...prices).toFixed(2)}` : "";
  const validity =
    validities.length === 1
      ? ` valid for ${validities[0]} days`
      : validities.length > 1
        ? ` with ${validities[0]}–${validities[validities.length - 1]} day options`
        : "";
  const coverageCount = new Set(location.covered_country_codes ?? []).size;
  const scope =
    location.coverage_type === "local" || coverageCount === 0
      ? coverage
      : `${coverage} across ${coverageCount} countries and areas`;

  return `Compare ${packages.length} prepaid ${location.title} eSIM data ${planLabel}${price}${validity}. ${scope} on RoamKit.net.`;
}

export function locationMetadata(
  location: Location,
  packages: Pick<Package, "price_usd" | "validity_days">[] = [],
): Metadata {
  const path = locationEsimPath(location.slug);
  const url = canonicalUrl(path);
  const title = `${location.title} eSIMs — RoamKit.net`;
  const description = locationSeoDescription(location, packages);
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: "RoamKit.net",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export function productionMetadataBase(): URL {
  return new URL(PRODUCTION_ORIGIN);
}
