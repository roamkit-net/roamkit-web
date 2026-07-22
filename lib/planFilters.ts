/** Plan-amount filter helpers for location package pickers. */

export type PlanFilter = "unlimited" | "standard";

/** Data vs Data / Calls / Texts — mirrors LocationDetail service tabs. */
export type ServiceType = "data" | "data_calls_texts";

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
 * Show Unlimited | Standard only on the Data tab when both categories exist.
 * Never for Data / Calls / Texts (even if a DCT row is flagged unlimited).
 * Same rule for local, regional, and global.
 *
 * After Partner sync, world/regional locations that sell both Unlimited and
 * Standard Data SKUs show the control; catalogs with only one category do not.
 */
export function shouldShowPlanFilter(
  packages: PlanFilterable[],
  serviceType: ServiceType = "data",
): boolean {
  if (serviceType !== "data") {
    return false;
  }
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

/**
 * Apply Unlimited | Standard only for Data. DCT returns the full list
 * (no plan-amount filter).
 */
export function filterPackagesByPlan(
  packages: PlanFilterable[],
  filter: PlanFilter,
  serviceType: ServiceType = "data",
): PlanFilterable[] {
  if (serviceType !== "data") {
    return packages;
  }
  if (filter === "unlimited") {
    return packages.filter((pkg) => pkg.is_unlimited);
  }
  return packages.filter((pkg) => !pkg.is_unlimited);
}
