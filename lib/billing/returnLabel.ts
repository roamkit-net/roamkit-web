/**
 * Human-readable label for a safe deposit `return` path.
 * Used for return-flow microcopy on /me/deposit.
 */
export function returnDestinationLabel(returnPath: string): string {
  const pathOnly = returnPath.split("?")[0] || returnPath;

  if (pathOnly === "/plans" || pathOnly.startsWith("/plans/")) {
    return "browse plans";
  }
  if (/^\/me\/esims\/[^/]+\/?$/.test(pathOnly)) {
    return "finish your top-up";
  }
  if (pathOnly === "/me/esims" || pathOnly.startsWith("/me/esims/")) {
    return "My eSIMs";
  }
  if (pathOnly.length > 1 && !pathOnly.includes("/", 1)) {
    // /{location} package detail
    return "finish your purchase";
  }
  return "continue where you left off";
}
