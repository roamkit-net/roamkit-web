import Link from "next/link";
import type { PropsWithChildren } from "react";

import { routes } from "@/lib/routes";

import { OpsSearch } from "@/components/ops/OpsSearch";

/**
 * Lightweight ops chrome — functional, not a second product brand.
 */
export function OpsShell({ children }: PropsWithChildren) {
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Link
              href={routes.adminDashboard}
              className="text-sm font-semibold tracking-tight text-slate-900"
            >
              RoamKit Ops
            </Link>
            <nav className="flex gap-3 text-sm">
              <Link
                href={routes.adminDashboard}
                className="text-slate-600 hover:text-slate-900"
              >
                Dashboard
              </Link>
              <Link
                href={routes.adminMembers}
                className="text-slate-600 hover:text-slate-900"
              >
                Members
              </Link>
              <Link
                href={routes.esims}
                className="text-slate-500 hover:text-slate-800"
              >
                Customer app
              </Link>
            </nav>
          </div>
          <div className="w-full sm:max-w-md">
            <OpsSearch />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
