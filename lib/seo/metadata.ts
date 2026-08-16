import type { Metadata } from "next";

import type { Location } from "@/lib/api";
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

export function locationSeoDescription(location: Location): string {
  const coverage = coveragePhrase(location.coverage_type);
  if (location.min_price_usd) {
    return `${location.title} eSIM data plans on RoamKit.net. ${coverage}. From $${location.min_price_usd}.`;
  }
  return `${location.title} eSIM data plans on RoamKit.net. ${coverage}.`;
}

export function locationMetadata(location: Location): Metadata {
  const path = locationEsimPath(location.slug);
  const url = canonicalUrl(path);
  const title = `${location.title} eSIMs — RoamKit.net`;
  const description = locationSeoDescription(location);
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

export function productionMetadataBase(): URL {
  return new URL(PRODUCTION_ORIGIN);
}
