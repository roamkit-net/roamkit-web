"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Empty } from "@/components/ui/Empty";
import { ListSkeleton } from "@/components/ui/ListSkeleton";
import { ApiError, clearTokens } from "@/lib/api";
import { fetchOpsUsers } from "@/lib/ops/client";
import type { OpsUserListItem } from "@/lib/ops/types";
import { loginHref } from "@/lib/navigation/safePath";
import { adminMemberPath, routes } from "@/lib/routes";

const PAGE_SIZE = 20;

type SortKey = "email" | "balance" | "last_login" | "flags";

const SORT_COLUMNS: { key: SortKey; label: string }[] = [
  { key: "email", label: "Email" },
  { key: "balance", label: "Balance" },
  { key: "last_login", label: "Last login" },
  { key: "flags", label: "Flags" },
];

function badgeVariant(
  badge: string,
): "primary" | "success" | "warning" | "danger" | "neutral" {
  if (badge === "staff") return "primary";
  if (badge === "google") return "success";
  if (badge === "wallet") return "neutral";
  if (badge === "disabled") return "danger";
  return "warning";
}

function toOrdering(key: SortKey, dir: "asc" | "desc"): string {
  return dir === "desc" ? `-${key}` : key;
}

export default function AdminMembersPage() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [members, setMembers] = useState<OpsUserListItem[]>([]);
  const [count, setCount] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchOpsUsers({
          q: q.trim() || undefined,
          page: page > 1 ? page : undefined,
          ordering: sortKey ? toOrdering(sortKey, sortDir) : undefined,
        });
        if (cancelled) return;
        setMembers(data.results);
        setCount(data.count);
        setHasNext(Boolean(data.next));
        setHasPrev(Boolean(data.previous) || page > 1);
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 401) {
          clearTokens();
          router.replace(loginHref(routes.adminMembers));
          return;
        }
        if (err instanceof ApiError && err.status === 403) {
          router.replace(routes.adminForbidden);
          return;
        }
        setError(err instanceof Error ? err.message : "Failed to load members");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, q ? 250 : 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [q, page, sortKey, sortDir, router]);

  function onSort(key: SortKey) {
    setPage(1);
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setSortDir("asc");
  }

  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));
  const from = count === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, count);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Members</h1>
          <p className="text-sm text-slate-600">{count} accounts</p>
        </div>
        <input
          type="search"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
          placeholder="Filter by email…"
          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm sm:max-w-xs"
        />
      </div>

      {error ? <Alert variant="error">{error}</Alert> : null}
      {loading ? <ListSkeleton rows={5} label="Loading members…" /> : null}

      {!loading && members.length === 0 ? (
        <Empty
          title="No members found"
          description="Try a different email filter."
        />
      ) : null}

      {!loading && members.length > 0 ? (
        <>
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  {SORT_COLUMNS.map(({ key, label }) => {
                    const active = sortKey === key;
                    const indicator = !active
                      ? ""
                      : sortDir === "asc"
                        ? " ↑"
                        : " ↓";
                    return (
                      <th
                        key={key}
                        className="px-4 py-3 font-medium"
                        aria-sort={
                          active
                            ? sortDir === "asc"
                              ? "ascending"
                              : "descending"
                            : "none"
                        }
                      >
                        <button
                          type="button"
                          onClick={() => onSort(key)}
                          className={
                            active
                              ? "text-slate-900 hover:underline"
                              : "hover:text-slate-800 hover:underline"
                          }
                        >
                          {label}
                          {indicator}
                        </button>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {members.map((member) => (
                  <tr
                    key={member.id}
                    className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={adminMemberPath(member.id)}
                        className="font-medium text-slate-900 hover:underline"
                      >
                        {member.email}
                      </Link>
                    </td>
                    <td className="px-4 py-3 tabular-nums text-slate-700">
                      {member.balance ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {member.last_login
                        ? new Date(member.last_login).toLocaleString()
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {member.badges.map((badge) => (
                          <Badge key={badge} variant={badgeVariant(badge)}>
                            {badge}
                          </Badge>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-600">
              Showing{" "}
              <span className="font-medium tabular-nums text-slate-800">
                {from}–{to}
              </span>{" "}
              of{" "}
              <span className="font-medium tabular-nums text-slate-800">
                {count}
              </span>
              <span className="text-slate-400">
                {" "}
                · page {page}/{totalPages}
              </span>
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={!hasPrev || loading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={!hasNext || loading}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
