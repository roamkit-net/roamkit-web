import Link from "next/link";

import { PlanCard } from "@/components/PlanCard";
import { ApiError, fetchPackages } from "@/lib/api";

export default async function PlansPage() {
  let packages: Awaited<ReturnType<typeof fetchPackages>>["results"] = [];
  let errorMessage: string | null = null;

  try {
    const response = await fetchPackages();
    packages = response.results;
  } catch (error) {
    if (error instanceof ApiError) {
      errorMessage = "Unable to load plans from the API right now.";
    } else {
      errorMessage = "Something went wrong while loading plans.";
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-16 text-slate-900">
      <main className="mx-auto w-full max-w-4xl">
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <Link
              href="/"
              className="text-sm font-medium text-sky-700 hover:text-sky-800"
            >
              ← Back to home
            </Link>
            <p className="mt-4 text-sm font-semibold uppercase tracking-[0.2em] text-sky-700">
              RoamKit
            </p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight">eSIM Plans</h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
              Browse data plans synced from our partner catalog. Checkout arrives
              in a later phase.
            </p>
          </div>
          <Link
            href="/login"
            className="rounded-lg bg-sky-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-800"
          >
            Sign in
          </Link>
        </div>

        {errorMessage ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
            <p className="font-medium">{errorMessage}</p>
            <p className="mt-2 text-sm">
              Ensure the API is running and packages have been synced.
            </p>
          </div>
        ) : packages.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <p className="text-lg font-medium text-slate-900">
              No plans available yet
            </p>
            <p className="mt-2 text-sm text-slate-600">
              Run a package sync on the API to populate the catalog.
            </p>
          </div>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2">
            {packages.map((plan) => (
              <li key={plan.id}>
                <PlanCard plan={plan} />
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
