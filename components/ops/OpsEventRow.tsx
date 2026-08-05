import Link from "next/link";

import { Badge } from "@/components/ui/Badge";
import type { OpsEvent, OpsEventGroup, OpsSeverity } from "@/lib/ops/types";
import { adminMemberPath } from "@/lib/routes";

const GROUP_LABEL: Record<OpsEventGroup, string> = {
  account: "Account",
  billing: "Billing",
  order: "Order",
  esim: "eSIM",
  wallet: "Wallet",
  voucher: "Voucher",
};

function severityVariant(
  severity: OpsSeverity,
): "neutral" | "warning" | "danger" | "success" {
  if (severity === "error") return "danger";
  if (severity === "warning") return "warning";
  return "neutral";
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function OpsEventRow({ event }: { event: OpsEvent }) {
  const group = (event.event_group || event.icon || "account") as OpsEventGroup;
  return (
    <li className="flex gap-3 border-b border-slate-100 py-3 last:border-0">
      <div className="w-28 shrink-0 text-xs text-slate-500">
        {formatTime(event.timestamp)}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={severityVariant(event.severity)}>
            {GROUP_LABEL[group] ?? group}
          </Badge>
          <span className="text-sm font-medium text-slate-900">{event.title}</span>
        </div>
        {event.subtitle ? (
          <p className="mt-0.5 truncate text-sm text-slate-600">{event.subtitle}</p>
        ) : null}
        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
          {event.user_email && event.user_id != null ? (
            <Link
              href={adminMemberPath(event.user_id)}
              className="hover:text-slate-800 hover:underline"
            >
              {event.user_email}
            </Link>
          ) : null}
          {event.reference_id ? (
            <span className="font-mono">{event.reference_id}</span>
          ) : null}
        </div>
      </div>
    </li>
  );
}

export function OpsEventList({
  events,
  emptyTitle = "No activity",
}: {
  events: OpsEvent[];
  emptyTitle?: string;
}) {
  if (events.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-slate-500">{emptyTitle}</p>
    );
  }
  return (
    <ul className="divide-y-0">
      {events.map((event) => (
        <OpsEventRow
          key={`${event.type}-${event.reference_id}-${event.timestamp}`}
          event={event}
        />
      ))}
    </ul>
  );
}
