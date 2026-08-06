"use client";

import Link from "next/link";

import { buttonClassName } from "@/components/ui/Button";
import { routes } from "@/lib/routes";

export default function AdminForbiddenPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="max-w-md rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900">Access denied</h1>
        <p className="mt-2 text-sm text-slate-600">
          This Operations Dashboard is limited to staff accounts.
        </p>
        <Link
          href={routes.esims}
          className={buttonClassName({
            tone: "app",
            variant: "primary",
            className: "mt-6 inline-flex",
          })}
        >
          Back to app
        </Link>
      </div>
    </div>
  );
}
