"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useState } from "react";

import { ApiError } from "@/lib/api";
import { fetchOpsSearch } from "@/lib/ops/client";
import type { OpsSearchResponse } from "@/lib/ops/types";
import { adminMemberPath, routes } from "@/lib/routes";

export function OpsSearch() {
  const router = useRouter();
  const inputId = useId();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<OpsSearchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const trimmed = q.trim();
    if (trimmed.length < 3) {
      setResults(null);
      setError(null);
      return;
    }
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchOpsSearch(trimmed);
        if (!cancelled) {
          setResults(data);
          setOpen(true);
        }
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 403) {
          router.replace(routes.adminForbidden);
          return;
        }
        setError(err instanceof Error ? err.message : "Search failed");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 300);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [q, router]);

  const hasHits =
    results &&
    (results.users.length > 0 ||
      results.orders.length > 0 ||
      results.deposits.length > 0 ||
      results.esims.length > 0 ||
      results.vouchers.length > 0);

  return (
    <div className="relative">
      <label htmlFor={inputId} className="sr-only">
        Global search
      </label>
      <input
        id={inputId}
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onFocus={() => results && setOpen(true)}
        placeholder="Search email, ICCID, order, tx, wallet…"
        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none ring-slate-400 focus:ring-2"
        autoComplete="off"
      />
      {open && (loading || error || results) ? (
        <div className="absolute z-20 mt-1 max-h-80 w-full overflow-auto rounded-md border border-slate-200 bg-white shadow-lg">
          {loading ? (
            <p className="px-3 py-2 text-sm text-slate-500">Searching…</p>
          ) : null}
          {error ? (
            <p className="px-3 py-2 text-sm text-red-600">{error}</p>
          ) : null}
          {results && !loading && !hasHits ? (
            <p className="px-3 py-2 text-sm text-slate-500">No matches</p>
          ) : null}
          {results?.users.map((hit) => (
            <Link
              key={`u-${hit.id}`}
              href={adminMemberPath(hit.id)}
              className="block px-3 py-2 text-sm hover:bg-slate-50"
              onClick={() => setOpen(false)}
            >
              <span className="font-medium">User</span> · {hit.label}
            </Link>
          ))}
          {results?.esims.map((hit) => (
            <Link
              key={`e-${hit.id}`}
              href={adminMemberPath(hit.user_id)}
              className="block px-3 py-2 text-sm hover:bg-slate-50"
              onClick={() => setOpen(false)}
            >
              <span className="font-medium">eSIM</span> · {hit.label}
            </Link>
          ))}
          {results?.orders.map((hit) => (
            <Link
              key={`o-${hit.id}`}
              href={adminMemberPath(hit.user_id)}
              className="block px-3 py-2 text-sm hover:bg-slate-50"
              onClick={() => setOpen(false)}
            >
              <span className="font-medium">Order</span> · {hit.label}
            </Link>
          ))}
          {results?.deposits.map((hit) => (
            <Link
              key={`d-${hit.id}`}
              href={adminMemberPath(hit.user_id)}
              className="block px-3 py-2 text-sm hover:bg-slate-50"
              onClick={() => setOpen(false)}
            >
              <span className="font-medium">Deposit</span> · {hit.label}
            </Link>
          ))}
          {results?.vouchers.map((hit) => (
            <div
              key={`v-${hit.id}`}
              className="px-3 py-2 text-sm text-slate-600"
            >
              <span className="font-medium">Voucher</span> · {hit.label} (
              {hit.status})
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
