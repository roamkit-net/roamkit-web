/** Plan-amount filter helpers for location package pickers. */

export type PlanFilter = "unlimited" | "standard";

export type PlanFilterable = {
  is_unlimited: boolean;
};

export function hasUnlimitedPlans(packages: PlanFilterable[]): boolean {
  return packages.some((pkg) => pkg.is_unlimited);
}

export function hasStandardPlans(packages: PlanFilterable[]): boolean {
  return packages.some((pkg) => !pkg.is_unlimited);
}

/**
 * Show Unlimited | Standard only when both categories exist for the
 * current service tab. Not gated on coverage_type (local/regional/global).
 *
 * Staging notes (Partner API catalog): europe/oceania/asia/africa-safari
 * have both; hello-africa (`africa`) and Discover Global (`world`) currently
 * ship only standard SKUs in Partner sync — toggle stays hidden there.
 * Consumer Airalo may list Discover Unlimited that Partner does not sell.
 */
export function shouldShowPlanFilter(packages: PlanFilterable[]): boolean {
  return hasUnlimitedPlans(packages) && hasStandardPlans(packages);
}

export function resolveActivePlanFilter(
  filter: PlanFilter,
  packages: PlanFilterable[],
): PlanFilter {
  const hasUnlimited = hasUnlimitedPlans(packages);
  const hasStandard = hasStandardPlans(packages);

  if (filter === "unlimited" && !hasUnlimited && hasStandard) {
    return "standard";
  }
  if (filter === "standard" && !hasStandard && hasUnlimited) {
    return "unlimited";
  }
  return filter;
}

export function filterPackagesByPlan(
  packages: PlanFilterable[],
  filter: PlanFilter,
): PlanFilterable[] {
  if (filter === "unlimited") {
    return packages.filter((pkg) => pkg.is_unlimited);
  }
  return packages.filter((pkg) => !pkg.is_unlimited);
}
