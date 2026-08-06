"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { OpsEventList } from "@/components/ops/OpsEventRow";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Card, CardSection } from "@/components/ui/Card";
import { DetailSkeleton } from "@/components/ui/ListSkeleton";
import { ApiError, clearTokens } from "@/lib/api";
import { fetchOpsUser } from "@/lib/ops/client";
import type { OpsUserDetail } from "@/lib/ops/types";
import { loginHref } from "@/lib/navigation/safePath";
import { routes } from "@/lib/routes";

function esimBadgeVariant(
  status: string,
): "success" | "warning" | "danger" | "neutral" | "primary" {
  if (status === "installed" || status === "activated" || status === "in_use") {
    return "success";
  }
  if (status === "exhausted" || status === "expired") return "danger";
  if (status === "purchased" || status === "installation_started") {
    return "warning";
  }
  return "neutral";
}

export default function AdminMemberDetailPage() {
  const params = useParams();
  const id = String(params.id ?? "");
  const router = useRouter();
  const [data, setData] = useState<OpsUserDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const detail = await fetchOpsUser(id);
        if (!cancelled) setData(detail);
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 401) {
          clearTokens();
          router.replace(loginHref(`/admin/members/${id}`));
          return;
        }
        if (err instanceof ApiError && err.status === 403) {
          router.replace(routes.adminForbidden);
          return;
        }
        setError(err instanceof Error ? err.message : "Failed to load member");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [id, router]);

  if (loading) {
    return <DetailSkeleton label="Loading member…" />;
  }

  if (error) {
    return <Alert variant="error">{error}</Alert>;
  }

  if (!data) {
    return <Alert variant="warning">Member not found</Alert>;
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={routes.adminMembers}
          className="text-sm text-slate-600 hover:text-slate-900"
        >
          ← Members
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">
          {data.email}
        </h1>
        <div className="mt-2 flex flex-wrap gap-2">
          {data.badges.map((badge) => (
            <Badge key={badge} variant="neutral">
              {badge}
            </Badge>
          ))}
          {!data.is_active ? <Badge variant="danger">disabled</Badge> : null}
        </div>
        <p className="mt-2 text-sm text-slate-600">
          Balance:{" "}
          <span className="font-medium tabular-nums text-slate-900">
            {data.account?.balance ?? "—"}
          </span>
          {" · "}
          Created {new Date(data.created_at).toLocaleString()}
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardSection padding="md">
            <h2 className="text-sm font-semibold">eSIMs</h2>
            {data.esims.length === 0 ? (
              <p className="mt-2 text-sm text-slate-500">No eSIMs</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {data.esims.map((esim) => (
                  <li
                    key={esim.id}
                    className="flex items-center justify-between gap-2 text-sm"
                  >
                    <span className="font-mono text-slate-800">{esim.iccid}</span>
                    <Badge variant={esimBadgeVariant(esim.status)}>
                      {esim.status_label}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardSection>
        </Card>

        <Card>
          <CardSection padding="md">
            <h2 className="text-sm font-semibold">Wallet</h2>
            {!data.wallet ? (
              <p className="mt-2 text-sm text-slate-500">No wallet identity</p>
            ) : (
              <dl className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-600">Verified deposit</dt>
                  <dd>{data.wallet.has_completed_deposit ? "Yes" : "No"}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-600">Total deposited</dt>
                  <dd className="tabular-nums">{data.wallet.total_deposited}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-600">Last deposit</dt>
                  <dd>
                    {data.wallet.last_deposit_at
                      ? new Date(data.wallet.last_deposit_at).toLocaleString()
                      : "—"}
                  </dd>
                </div>
                {data.wallet.addresses.map((addr) => (
                  <div key={addr.id} className="border-t border-slate-100 pt-2">
                    <dt className="text-slate-600">
                      {addr.chain} · {addr.status}
                    </dt>
                    <dd className="break-all font-mono text-xs">{addr.address}</dd>
                  </div>
                ))}
              </dl>
            )}
            {data.device_hints.user_agent ? (
              <p className="mt-4 break-all text-xs text-slate-500">
                UA: {data.device_hints.user_agent}
              </p>
            ) : null}
          </CardSection>
        </Card>
      </div>

      <Card>
        <CardSection padding="md">
          <h2 className="text-sm font-semibold">Timeline</h2>
          <div className="mt-2">
            <OpsEventList
              events={data.timeline}
              emptyTitle="No timeline events yet"
            />
          </div>
        </CardSection>
      </Card>
    </div>
  );
}
