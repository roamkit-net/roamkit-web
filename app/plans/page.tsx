import { Suspense } from "react";

import { PlansStore } from "@/components/PlansStore";
import { ApiError, fetchAllLocations, type LocationListType } from "@/lib/api";

function parseTab(value: string | string[] | undefined): LocationListType {
  const raw = Array.isArray(value) ? value[0] : value;
  if (
    raw === "local" ||
    raw === "regional" ||
    raw === "global" ||
    raw === "all" ||
    raw === "popular"
  ) {
    return raw;
  }
  return "popular";
}

export default async function PlansPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string | string[] }>;
}) {
  const params = await searchParams;
  const tab = parseTab(params.tab);

  let locations: Awaited<ReturnType<typeof fetchAllLocations>> = [];
  let errorMessage: string | null = null;

  try {
    locations = await fetchAllLocations();
  } catch (error) {
    if (error instanceof ApiError) {
      errorMessage = "Unable to load destinations from the API right now.";
    } else {
      errorMessage = "Something went wrong while loading destinations.";
    }
  }

  return (
    <Suspense fallback={null}>
      <PlansStore
        locations={locations}
        errorMessage={errorMessage}
        initialTab={tab}
      />
    </Suspense>
  );
}
