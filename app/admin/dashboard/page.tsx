"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { OpsEventList } from "@/components/ops/OpsEventRow";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Card, CardSection } from "@/components/ui/Card";
import { Empty } from "@/components/ui/Empty";
import { ListSkeleton } from "@/components/ui/ListSkeleton";
import { ApiError, clearTokens } from "@/lib/api";
import { fetchOpsDashboard } from "@/lib/ops/client";
import type { OpsDashboard } from "@/lib/ops/types";
import { loginHref } from "@/lib/navigation/safePath";
import { routes } from "@/lib/routes";

function KpiCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-slate-900">
        {value}
      </p>
    </div>
  );
}

function healthVariant(
  status: string,
): "success" | "danger" | "warning" | "neutral" {
  if (status === "ok" || status === "enabled") return "success";
  if (status === "error" || status === "misconfigured") return "danger";
  if (status === "disabled") return "warning";
  return "neutral";
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<OpsDashboard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const dashboard = await fetchOpsDashboard();
        if (!cancelled) setData(dashboard);
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 401) {
          clearTokens();
          router.replace(loginHref(routes.adminDashboard));
          return;
        }
        if (err instanceof ApiError && err.status === 403) {
          router.replace(routes.adminForbidden);
          return;
        }
        setError(err instanceof Error ? err.message : "Failed to load dashboard");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (loading) {
    return <ListSkeleton rows={4} label="Loading dashboard…" />;
  }

  if (error) {
    return <Alert variant="error">{error}</Alert>;
  }

  if (!data) {
    return <Empty title="No dashboard data" />;
  }

  const { kpi, pending_work, financial, health, alerts, activity } = data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-600">
          Read-only operations overview (schema v{data.schema_version})
        </p>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="New users today" value={kpi.new_users_today} />
        <KpiCard label="Orders today" value={kpi.orders_today} />
        <KpiCard label="Deposits today" value={kpi.deposits_today} />
        <KpiCard label="Revenue today" value={`$${kpi.revenue_today}`} />
        <KpiCard label="New eSIMs today" value={kpi.new_esims_today} />
        <KpiCard label="Topups today" value={kpi.topups_today} />
        <KpiCard label="Users total" value={kpi.users_total} />
        <KpiCard label="Active eSIMs" value={kpi.active_esims} />
      </section>

      <section className="flex flex-wrap gap-2">
        {Object.entries(health).map(([key, item]) => (
          <Badge key={key} variant={healthVariant(item.status)} title={item.detail}>
            {key}: {item.status}
          </Badge>
        ))}
      </section>

      {alerts.length > 0 ? (
        <section className="space-y-2">
          {alerts.map((alert) => (
            <Alert key={alert.code} variant="error">
              {alert.title} ({alert.count})
            </Alert>
          ))}
        </section>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardSection padding="md">
            <h2 className="text-sm font-semibold text-slate-900">Pending work</h2>
            <dl className="mt-3 space-y-2 text-sm">
              {(
                [
                  ["Pending deposits", pending_work.pending_deposits],
                  ["Pending topups", pending_work.pending_topups],
                  ["Pending orders", pending_work.pending_orders],
                  ["Failed orders (24h)", pending_work.failed_orders_24h],
                  ["Stuck installs", pending_work.stuck_installs],
                ] as const
              ).map(([label, value]) => (
                <div key={label} className="flex justify-between gap-4">
                  <dt className="text-slate-600">{label}</dt>
                  <dd className="font-medium tabular-nums">{value}</dd>
                </div>
              ))}
            </dl>
          </CardSection>
        </Card>

        <Card className="lg:col-span-1">
          <CardSection padding="md">
            <h2 className="text-sm font-semibold text-slate-900">Financial</h2>
            <dl className="mt-3 space-y-2 text-sm">
              {(
                [
                  ["Deposits today", financial.deposits_today_amount],
                  ["Spend today", financial.spend_today_amount],
                  ["Avg deposit 30d", financial.average_deposit_30d],
                  ["Largest 30d", financial.largest_deposit_30d],
                  ["Pending amount", financial.pending_deposit_amount],
                  ["Revenue today", financial.revenue_today],
                ] as const
              ).map(([label, value]) => (
                <div key={label} className="flex justify-between gap-4">
                  <dt className="text-slate-600">{label}</dt>
                  <dd className="font-medium tabular-nums">{value}</dd>
                </div>
              ))}
            </dl>
          </CardSection>
        </Card>

        <Card className="lg:col-span-1">
          <CardSection padding="md">
            <h2 className="text-sm font-semibold text-slate-900">
              Top destinations
            </h2>
            {data.top_destinations.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">No data yet</p>
            ) : (
              <ul className="mt-3 space-y-1 text-sm">
                {data.top_destinations.map((row) => (
                  <li key={row.country_code} className="flex justify-between">
                    <span>{row.country_code}</span>
                    <span className="tabular-nums">{row.count}</span>
                  </li>
                ))}
              </ul>
            )}
            <h2 className="mt-6 text-sm font-semibold text-slate-900">
              Top packages
            </h2>
            {data.top_packages.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">No data yet</p>
            ) : (
              <ul className="mt-3 space-y-1 text-sm">
                {data.top_packages.map((row) => (
                  <li
                    key={row.package_title}
                    className="flex justify-between gap-2"
                  >
                    <span className="truncate">{row.package_title}</span>
                    <span className="shrink-0 tabular-nums">{row.count}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardSection>
        </Card>
      </div>

      <Card>
        <CardSection padding="md">
          <h2 className="text-sm font-semibold text-slate-900">Live activity</h2>
          <div className="mt-2">
            <OpsEventList events={activity} emptyTitle="No recent events" />
          </div>
        </CardSection>
      </Card>
    </div>
  );
}
