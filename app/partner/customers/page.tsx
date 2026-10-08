"use client";

import { useEffect, useState } from "react";

import { buttonClassName } from "@/components/ui/Button";
import { accountLabel } from "@/lib/accountLabel";
import { ApiError } from "@/lib/api";
import {
  fetchCustomers,
  fetchSummary,
  postGrant,
  type PartnerCustomer,
  type PartnerRole,
} from "@/lib/partner/client";

export default function PartnerCustomersPage() {
  const [rows, setRows] = useState<PartnerCustomer[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [role, setRole] = useState<PartnerRole>("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [count, setCount] = useState(0);
  const [balance, setBalance] = useState<string | null>(null);
  const [target, setTarget] = useState<PartnerCustomer | null>(null);
  const [amount, setAmount] = useState("");
  const [idempotencyKey, setIdempotencyKey] = useState("");
  const [grantError, setGrantError] = useState<string | null>(null);

  async function load(nextPage = page, nextQuery = query) {
    setError(null);
    setRows(null);
    const params = new URLSearchParams({
      page: String(nextPage),
      page_size: "50",
      sort: "total_partner_earned",
      order: "desc",
    });
    if (nextQuery.trim()) {
      params.set("q", nextQuery.trim());
    }
    try {
      const result = await fetchCustomers(params);
      setRows(result.data.results);
      setCount(result.data.count);
      setRole(result.role);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "request_failed");
    }
  }

  useEffect(() => {
    void load(1, "");
    // Initial load only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function openGrant(row: PartnerCustomer) {
    setTarget(row);
    setAmount("");
    setIdempotencyKey(crypto.randomUUID());
    setGrantError(null);
    fetchSummary()
      .then((result) => setBalance(result.data.available_balance))
      .catch(() => setBalance(null));
  }

  function onAmount(value: string) {
    setAmount(value);
    setIdempotencyKey(crypto.randomUUID());
    setGrantError(null);
  }

  async function submitGrant() {
    if (!target || !idempotencyKey) {
      return;
    }
    setGrantError(null);
    try {
      await postGrant({
        customer_id: target.customer_id,
        amount,
        idempotency_key: idempotencyKey,
      });
      setTarget(null);
      const summary = await fetchSummary().catch(() => null);
      setBalance(summary?.data.available_balance ?? null);
      await load();
    } catch (err) {
      const code = err instanceof ApiError ? err.message : "request_failed";
      if (code === "insufficient_funds") {
        const summary = await fetchSummary().catch(() => null);
        setBalance(summary?.data.available_balance ?? null);
      }
      if (code === "customer_attribution_changed" || code === "customer_not_found") {
        setTarget(null);
        await load();
      }
      setGrantError(code);
    }
  }

  return (
    <section>
      <h1 className="text-xl font-semibold">Customers</h1>
      <form
        className="mt-4 flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          setPage(1);
          void load(1, query);
        }}
      >
        <label className="sr-only" htmlFor="customer-q">
          Search customers
        </label>
        <input
          id="customer-q"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <button type="submit" className={buttonClassName({ size: "sm" })}>
          Search
        </button>
      </form>
      {error ? <p className="mt-4 text-sm text-red-700">{error}</p> : null}
      {rows === null && !error ? (
        <p className="mt-4 text-sm text-slate-500">Loading customers…</p>
      ) : null}
      {rows && rows.length === 0 ? (
        <p className="mt-4 text-sm text-slate-600">No customers.</p>
      ) : null}
      {rows && rows.length > 0 ? (
        <ul className="mt-4 divide-y divide-slate-200">
          {rows.map((row) => (
            <li key={row.customer_id} className="flex flex-wrap items-center gap-3 py-3 text-sm">
              <span>{row.customer_id}</span>
              <span>{accountLabel(row.display_name, row.email)}</span>
              <span>{row.attributed_at}</span>
              <span>{row.total_partner_earned}</span>
              <span>{row.accrual_count}</span>
              {role === "owner" || role === "admin" ? (
                <button
                  type="button"
                  className={buttonClassName({ variant: "secondary", size: "sm" })}
                  onClick={() => openGrant(row)}
                >
                  Give credit
                </button>
              ) : null}
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
        <span className="text-sm">{count} customers</span>
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
      {target ? (
        <div role="dialog" aria-modal="true" aria-labelledby="grant-title" className="mt-6 rounded-xl border border-slate-200 p-4">
          <h2 id="grant-title" className="font-semibold">
            Give credit
          </h2>
          <p className="mt-2 text-sm">{accountLabel(target.display_name, target.email)}</p>
          <p className="text-sm">Available balance {balance ?? "…"}</p>
          <label className="mt-3 block text-sm" htmlFor="grant-amount">
            Amount
          </label>
          <input
            id="grant-amount"
            value={amount}
            onChange={(event) => onAmount(event.target.value)}
            className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          {grantError ? <p className="mt-2 text-sm text-red-700">{grantError}</p> : null}
          <div className="mt-3 flex gap-2">
            <button type="button" className={buttonClassName({ size: "sm" })} onClick={() => void submitGrant()}>
              Confirm
            </button>
            <button
              type="button"
              className={buttonClassName({ variant: "ghost", size: "sm" })}
              onClick={() => setTarget(null)}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
