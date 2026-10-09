"use client";

import { useEffect, useState } from "react";

import { buttonClassName } from "@/components/ui/Button";
import { ApiError } from "@/lib/api";
import { accountLabel } from "@/lib/accountLabel";
import { fetchGrants, type PartnerGrant } from "@/lib/partner/client";

function dash(value: string | null): string {
  return value && value.length > 0 ? value : "—";
}

export default function PartnerGrantsPage() {
  const [rows, setRows] = useState<PartnerGrant[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [count, setCount] = useState(0);

  async function load(nextPage: number) {
    setRows(null);
    setError(null);
    const params = new URLSearchParams({
      page: String(nextPage),
      page_size: "50",
      sort: "created_at",
      order: "desc",
    });
    try {
      const result = await fetchGrants(params);
      setRows(result.data.results);
      setCount(result.data.count);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "request_failed");
    }
  }

  useEffect(() => {
    void load(1);
  }, []);

  return (
    <section>
      <h1 className="text-xl font-semibold">Grants</h1>
      {error ? <p className="mt-4 text-sm text-red-700">{error}</p> : null}
      {rows === null && !error ? (
        <p className="mt-4 text-sm text-slate-500">Loading grants…</p>
      ) : null}
      {rows && rows.length === 0 ? (
        <p className="mt-4 text-sm">No grants.</p>
      ) : null}
      {rows && rows.length > 0 ? (
        <ul className="mt-4 divide-y divide-slate-200 text-sm">
          {rows.map((row) => (
            <li key={row.grant_id} className="grid gap-1 py-3">
              <span>{row.grant_id}</span>
              <span>
                {row.customer_id} · {dash(accountLabel(row.display_name, row.email))}
              </span>
              <span>{row.amount}</span>
              <span>
                {row.granted_by
                  ? `${row.granted_by.user_id} · ${dash(accountLabel(row.granted_by.display_name, row.granted_by.email))}`
                  : "—"}
              </span>
              <span>{row.created_at}</span>
            </li>
          ))}
        </ul>
      ) : null}
      <div className="mt-4 flex gap-2">
        <button
          type="button"
          className={buttonClassName({ variant: "ghost", size: "sm" })}
          disabled={page <= 1}
          onClick={() => {
            const next = page - 1;
            setPage(next);
            void load(next);
          }}
        >
          Previous
        </button>
        <span className="text-sm">{count} grants</span>
        <button
          type="button"
          className={buttonClassName({ variant: "ghost", size: "sm" })}
          disabled={rows !== null && page * 50 >= count}
          onClick={() => {
            const next = page + 1;
            setPage(next);
            void load(next);
          }}
        >
          Next
        </button>
      </div>
    </section>
  );
}
