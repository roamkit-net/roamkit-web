import Link from "next/link";

import type { Location, Package } from "@/lib/api";

function uniqueNonEmpty(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function packageSummary(packages: Package[]): string {
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
  const parts = [`Compare ${packages.length} prepaid eSIM ${planLabel}`];

  if (prices.length > 0) {
    parts.push(`with prices from $${Math.min(...prices).toFixed(2)}`);
  }
  if (validities.length === 1) {
    parts.push(`valid for ${validities[0]} days`);
  } else if (validities.length > 1) {
    parts.push(
      `with validity from ${validities[0]} to ${validities.at(-1)} days`,
    );
  }

  return `${parts.join(", ")}.`;
}

function coverageSummary(location: Location): string {
  const countryCodes = uniqueNonEmpty(location.covered_country_codes ?? []);
  const coverageNames = uniqueNonEmpty(
    (location.coverages ?? []).map((coverage) => coverage.name),
  );
  const networkNames = uniqueNonEmpty(
    (location.coverages ?? []).flatMap((coverage) =>
      coverage.networks.map((network) => network.name),
    ),
  );
  const networkTypes = uniqueNonEmpty(
    (location.coverages ?? []).flatMap((coverage) =>
      coverage.networks.flatMap((network) => network.types),
    ),
  );

  const parts: string[] = [];
  if (location.coverage_type === "local") {
    parts.push(`The current catalog lists local coverage for ${location.title}`);
  } else {
    const coverageCount = Math.max(countryCodes.length, coverageNames.length);
    const scope = location.coverage_type === "global" ? "global" : "regional";
    parts.push(
      coverageCount > 0
        ? `This ${scope} eSIM lists coverage across ${coverageCount} countries and areas`
        : `The current catalog lists ${scope} coverage`,
    );
  }

  if (networkNames.length > 0) {
    parts.push(
      `available networks include ${networkNames.slice(0, 4).join(", ")}`,
    );
  }
  if (networkTypes.length > 0) {
    parts.push(
      `listed connection types include ${networkTypes.slice(0, 4).join(", ")}`,
    );
  }

  return `${parts.join("; ")}.`;
}

export function LocationSeoContent({
  location,
  packages,
}: {
  location: Location;
  packages: Package[];
}) {
  const allowances = uniqueNonEmpty(
    packages.map((pkg) => pkg.data_allowance),
  ).slice(0, 6);
  const tab =
    location.coverage_type === "local"
      ? "local"
      : location.coverage_type === "regional"
        ? "regional"
        : "global";

  return (
    <section
      className="mt-14 border-t border-[var(--app-border-chrome)] pt-8"
      aria-labelledby="location-plan-details"
    >
      <h2
        id="location-plan-details"
        className="text-xl font-semibold text-[var(--app-chrome-text)]"
      >
        About {location.title} eSIM plans
      </h2>
      <div className="mt-3 max-w-3xl space-y-3 text-sm leading-6 text-[var(--app-chrome-text-muted)]">
        <p>{packageSummary(packages)}</p>
        {allowances.length > 0 ? (
          <p>Current data options include {allowances.join(", ")}.</p>
        ) : null}
        <p>{coverageSummary(location)}</p>
        <p>
          Package availability and network details can change. Review the
          selected plan before purchase, or{" "}
          <Link
            href={`/plans?tab=${tab}`}
            className="font-medium text-[var(--app-primary)] underline underline-offset-2"
          >
            browse all {tab} eSIM destinations
          </Link>
          .
        </p>
      </div>
    </section>
  );
}
