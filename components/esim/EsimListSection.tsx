"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { Badge } from "@/components/ui/Badge";
import { buttonClassName } from "@/components/ui/Button";
import { listRowClassName } from "@/components/ui/ListRow";
import { Esim, flagImageUrl } from "@/lib/api";
import {
  esimDestinationLabel,
  esimValidityLabel,
  formatEsimStatus,
  truncateNote,
} from "@/lib/esim/display";
import { needsSetup } from "@/lib/esim/telemetry";

export type EsimListRowAction = "archive" | "restore";

function formatUsage(esim: Esim): string {
  if (esim.usage_is_unlimited) {
    return "Unlimited";
  }
  if (esim.usage_remaining_mb == null || esim.usage_total_mb == null) {
    return "Usage not synced";
  }
  return `${esim.usage_remaining_mb} / ${esim.usage_total_mb} MB`;
}

function EsimListRow({
  esim,
  action,
  pending,
  onAction,
}: {
  esim: Esim;
  action?: EsimListRowAction;
  pending: boolean;
  onAction?: (esim: Esim) => void;
}) {
  const destination = esimDestinationLabel(esim);
  const validity = esimValidityLabel(esim);
  const statusLabel = formatEsimStatus(esim.status);
  const notePreview = truncateNote(esim.note);
  const flagSrc = esim.country_code
    ? flagImageUrl(esim.country_code)
    : null;
  const href = needsSetup(esim)
    ? `/me/esims/${esim.id}/setup`
    : `/me/esims/${esim.id}`;

  return (
    <li>
      <div className={listRowClassName({ interactive: true })}>
        <Link
          href={href}
          className="flex min-w-0 flex-1 items-center gap-4 outline-none"
        >
          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md bg-slate-100">
            {flagSrc ? (
              <Image
                src={flagSrc}
                alt=""
                fill
                className="object-cover"
                sizes="40px"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs font-semibold uppercase text-slate-400">
                {destination.slice(0, 2)}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h2 className="text-base font-semibold text-slate-900">
                {destination}
              </h2>
              {validity ? (
                <span className="text-sm text-slate-600">{validity}</span>
              ) : null}
            </div>
            <p className="mt-0.5 truncate text-sm text-slate-500">
              {esim.data_allowance
                ? `${esim.data_allowance} · ${formatUsage(esim)}`
                : formatUsage(esim)}
            </p>
            {notePreview ? (
              <p className="mt-0.5 truncate text-sm text-slate-500">
                {notePreview}
              </p>
            ) : null}
          </div>
        </Link>
        <div className="flex shrink-0 items-center gap-2">
          {action && onAction ? (
            <button
              type="button"
              disabled={pending}
              onClick={() => onAction(esim)}
              className={buttonClassName({
                variant: "ghost",
                size: "sm",
                tone: "app",
                className: "shrink-0",
              })}
            >
              {pending
                ? action === "archive"
                  ? "Archiving…"
                  : "Restoring…"
                : action === "archive"
                  ? "Archive"
                  : "Restore"}
            </button>
          ) : null}
          <Badge variant="default" className="shrink-0">
            {statusLabel}
          </Badge>
        </div>
      </div>
    </li>
  );
}

export type EsimListSectionProps = {
  title: string;
  listId: string;
  esims: Esim[];
  /** Initial open state only — not re-applied on parent re-renders. */
  defaultOpen?: boolean;
  action?: EsimListRowAction;
  pendingId: number | null;
  onAction?: (esim: Esim) => void;
};

/**
 * Collapsible My eSIMs section (Active / Expired / Archived).
 * Presentation grouping only — does not change row navigation or archive actions.
 */
export function EsimListSection({
  title,
  listId,
  esims,
  defaultOpen = true,
  action,
  pendingId,
  onAction,
}: EsimListSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  if (esims.length === 0) {
    return null;
  }

  return (
    <section className="grid gap-3">
      <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--app-chrome-text-muted)]">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={listId}
          onClick={() => setOpen((value) => !value)}
          className="flex w-full items-center justify-between gap-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--app-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--app-background)]"
        >
          <span>
            {title}
            <span className="ml-2 font-semibold normal-case tracking-normal text-[var(--app-chrome-text-muted)]">
              ({esims.length})
            </span>
          </span>
          <span aria-hidden>{open ? "▾" : "▸"}</span>
        </button>
      </h2>
      {open ? (
        <ul id={listId} className="grid gap-3">
          {esims.map((esim) => (
            <EsimListRow
              key={esim.id}
              esim={esim}
              action={action}
              pending={pendingId === esim.id}
              onAction={onAction}
            />
          ))}
        </ul>
      ) : null}
    </section>
  );
}
