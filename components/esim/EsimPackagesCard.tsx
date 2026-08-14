"use client";

import { useState } from "react";

import { Badge } from "@/components/ui/Badge";
import { Card, CardSection } from "@/components/ui/Card";
import type { AppliedPackage, EsimUsage } from "@/lib/api";
import { formatEsimDateTime } from "@/lib/esim/display";
import {
  appliedPackageKindLabel,
  appliedPackageStatusLabel,
  formatDataMb,
  formatPaidAmount,
  packageSpecLabel,
  partitionAppliedPackages,
  usageBarModel,
} from "@/lib/esim/packages";

export type EsimPackagesCardProps = {
  packages: AppliedPackage[];
  packagesError: string | null;
  usageError?: string | null;
  usage: EsimUsage | null;
  cachedRemainingMb: number | null;
  cachedTotalMb: number | null;
  cachedUnlimited: boolean | null;
  isRefreshing: boolean;
  onRefresh: () => void;
};

function statusBadgeVariant(
  status: string,
): "primary" | "neutral" {
  return status === "active" ? "primary" : "neutral";
}

function PackageRow({ pkg }: { pkg: AppliedPackage }) {
  const [open, setOpen] = useState(false);
  const detailsId = `esim-package-${pkg.id}-details`;

  return (
    <li>
      <div className="flex flex-col gap-2" data-testid="esim-packages-row">
        <button
          type="button"
          className="flex w-full items-center gap-2 text-left"
          aria-expanded={open}
          aria-controls={detailsId}
          onClick={() => setOpen((value) => !value)}
          data-testid="esim-packages-row-trigger"
        >
          <span aria-hidden className="shrink-0 text-slate-500">
            {open ? "▾" : "▸"}
          </span>
          <span className="shrink-0 font-semibold text-slate-900">
            {appliedPackageKindLabel(pkg.kind)}
          </span>
          <span className="min-w-0 truncate text-sm text-slate-600">
            {packageSpecLabel(pkg)}
          </span>
          <Badge
            variant={statusBadgeVariant(pkg.status)}
            className="ml-auto shrink-0"
            data-testid="esim-packages-row-status"
          >
            {appliedPackageStatusLabel(pkg.status)}
          </Badge>
        </button>
        {open ? (
          <ul id={detailsId} className="flex flex-col gap-1 pl-7 text-sm">
            <li className="flex items-baseline gap-3">
              <span className="w-28 shrink-0 font-semibold text-slate-900">
                Created on
              </span>
              <span className="text-slate-600">
                {formatEsimDateTime(pkg.created_at)}
              </span>
            </li>
            <li className="flex items-baseline gap-3">
              <span className="w-28 shrink-0 font-semibold text-slate-900">
                Activated on
              </span>
              <span className="text-slate-600">
                {formatEsimDateTime(pkg.activated_at)}
              </span>
            </li>
            <li className="flex items-baseline gap-3">
              <span className="w-28 shrink-0 font-semibold text-slate-900">
                Expires on
              </span>
              <span className="text-slate-600">
                {formatEsimDateTime(pkg.expires_at)}
              </span>
            </li>
            <li className="flex items-baseline gap-3">
              <span className="w-28 shrink-0 font-semibold text-slate-900">
                Amount
              </span>
              <span className="text-slate-600">
                {formatPaidAmount(pkg.paid_usd, pkg.currency)}
              </span>
            </li>
          </ul>
        ) : null}
      </div>
    </li>
  );
}

function PackageAccordion({
  title,
  listId,
  packages,
  testId,
}: {
  title: string;
  listId: string;
  packages: AppliedPackage[];
  testId: string;
}) {
  const [open, setOpen] = useState(true);
  if (packages.length === 0) {
    return null;
  }

  return (
    <div data-testid={testId}>
      <button
        type="button"
        className="flex w-full items-center gap-3 text-left"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((value) => !value)}
        data-testid={`${testId}-trigger`}
      >
        <p className="flex-1 font-semibold text-slate-900">{title}</p>
        <span className="inline-block rounded-full bg-slate-100 px-2 text-xs text-slate-600">
          {packages.length}
        </span>
        <span aria-hidden className="text-slate-500">
          {open ? "▾" : "▸"}
        </span>
      </button>
      {open ? (
        <ul id={listId} className="mt-3 flex flex-col gap-3">
          {packages.map((pkg) => (
            <PackageRow key={pkg.id} pkg={pkg} />
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function UsageBar({
  usage,
  cachedRemainingMb,
  cachedTotalMb,
  cachedUnlimited,
}: Pick<
  EsimPackagesCardProps,
  "usage" | "cachedRemainingMb" | "cachedTotalMb" | "cachedUnlimited"
>) {
  const model = usageBarModel({
    remainingMb: usage?.remaining_mb ?? cachedRemainingMb,
    totalMb: usage?.total_mb ?? cachedTotalMb,
    isUnlimited: usage?.is_unlimited ?? cachedUnlimited,
  });

  if (model.kind === "unlimited") {
    return (
      <p className="text-sm text-slate-600" data-testid="esim-packages-usage">
        Unlimited
      </p>
    );
  }
  if (model.kind === "unavailable") {
    return (
      <p className="text-sm text-slate-600" data-testid="esim-packages-usage">
        Usage not synced
      </p>
    );
  }

  const width = (model.remainingMb / model.totalMb) * 100;

  return (
    <div className="flex flex-col gap-1" data-testid="esim-packages-usage">
      <div className="flex justify-between text-xs text-slate-500">
        <p>
          Data left: {formatDataMb(model.remainingMb)} ({model.remainingPercent}
          %)
        </p>
        <p>
          Data used: {formatDataMb(model.usedMb)} ({model.usedPercent}%)
        </p>
      </div>
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={model.totalMb}
        aria-valuenow={model.remainingMb}
        aria-valuetext={`${model.remainingPercent}%`}
        aria-label={`${model.remainingPercent}% remaining`}
        className="relative h-1.5 overflow-hidden rounded-full bg-slate-200"
      >
        <div
          className="h-full rounded-full bg-sky-600 transition-all duration-500"
          style={{ width: `${Math.min(100, Math.max(0, width))}%` }}
        />
      </div>
    </div>
  );
}

export function EsimPackagesCard({
  packages,
  packagesError,
  usageError = null,
  usage,
  cachedRemainingMb,
  cachedTotalMb,
  cachedUnlimited,
  isRefreshing,
  onRefresh,
}: EsimPackagesCardProps) {
  const { available, previous, unknown } = partitionAppliedPackages(packages);

  return (
    <Card as="section" data-testid="esim-packages-card">
      <CardSection>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Packages</h2>
            <p className="mt-1 text-sm text-slate-600">
              Track your combined data balance for all packages on this eSIM.
            </p>
          </div>
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            data-testid="esim-packages-refresh"
          >
            {isRefreshing ? "Refreshing…" : "Refresh"}
          </button>
        </div>

        <div className="mt-4">
          <UsageBar
            usage={usage}
            cachedRemainingMb={cachedRemainingMb}
            cachedTotalMb={cachedTotalMb}
            cachedUnlimited={cachedUnlimited}
          />
        </div>
        {usageError ? (
          <p className="mt-2 text-sm text-amber-800">{usageError}</p>
        ) : null}

        {packagesError ? (
          <div
            className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900"
            data-testid="esim-packages-error"
          >
            <p>{packagesError}</p>
            <button
              type="button"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="font-medium underline disabled:opacity-60"
              data-testid="esim-packages-retry"
            >
              Retry
            </button>
          </div>
        ) : null}

        {!packagesError &&
        available.length === 0 &&
        previous.length === 0 &&
        unknown.length === 0 ? (
          <p className="mt-4 text-sm text-slate-600">
            No packages on this eSIM yet.
          </p>
        ) : null}

        {available.length > 0 || previous.length > 0 || unknown.length > 0 ? (
          <div className="mt-4 flex flex-col gap-4">
            <PackageAccordion
              title="Available packages"
              listId="esim-packages-available-list"
              packages={available}
              testId="esim-packages-available"
            />
            <PackageAccordion
              title="Previous packages"
              listId="esim-packages-previous-list"
              packages={previous}
              testId="esim-packages-previous"
            />
            <PackageAccordion
              title="Unknown packages"
              listId="esim-packages-unknown-list"
              packages={unknown}
              testId="esim-packages-unknown"
            />
          </div>
        ) : null}
      </CardSection>
    </Card>
  );
}
