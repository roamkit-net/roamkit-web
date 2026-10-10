"use client";

import { useEffect, useState } from "react";

import {
  isPartnerAccessDenied,
  usePartnerPortal,
} from "@/components/partner/PartnerShell";
import { usePartnerChannelGuard } from "@/components/partner/usePartnerChannel";
import { partnerErrorMessage } from "@/lib/partner/errors";
import { buttonClassName } from "@/components/ui/Button";
import { accountLabel } from "@/lib/accountLabel";
import { ApiError } from "@/lib/api";
import {
  fetchCustomers,
  fetchSummary,
  postGrant,
  type PartnerCustomer,
} from "@/lib/partner/client";
import { rowsForChannel } from "@/lib/partner/selection";

export default function PartnerCustomersPage() {
  const { context, reportAccessDenied } = usePartnerPortal();
  const channelId = context.channel_id;
  const { isCurrent } = usePartnerChannelGuard(channelId);
  const [loadedId, setLoadedId] = useState<string | null>(null);
  const [rows, setRows] = useState<PartnerCustomer[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [count, setCount] = useState(0);
  const [balance, setBalance] = useState<string | null>(null);
  const [target, setTarget] = useState<PartnerCustomer | null>(null);
  const [amount, setAmount] = useState("");
  const [idempotencyKey, setIdempotencyKey] = useState("");
  const [grantError, setGrantError] = useState<string | null>(null);

  async function load(selected: string, nextPage = page, nextQuery = query) {
    setError(null);
    setLoadedId(null);
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
      const result = await fetchCustomers(selected, params);
      if (!isCurrent(selected)) {
        return;
      }
      setRows(result.data.results);
      setCount(result.data.count);
      setLoadedId(selected);
    } catch (err) {
      if (!isCurrent(selected)) {
        return;
      }
      if (isPartnerAccessDenied(err)) {
        await reportAccessDenied();
        return;
      }
      const code = err instanceof ApiError ? err.message : "request_failed";
      setError(partnerErrorMessage(code));
    }
  }

  useEffect(() => {
    setTarget(null);
    setPage(1);
    void load(channelId, 1, "");
    // Reload when the selected channel changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelId]);

  function openGrant(row: PartnerCustomer) {
    const selected = channelId;
    setTarget(row);
    setAmount("");
    setIdempotencyKey(crypto.randomUUID());
    setGrantError(null);
    fetchSummary(selected)
      .then((result) => {
        if (selected === channelId) {
          setBalance(result.data.available_balance);
        }
      })
      .catch((err: unknown) => {
        if (isPartnerAccessDenied(err)) {
          void reportAccessDenied();
          return;
        }
        setBalance(null);
      });
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
    const selected = channelId;
    const body = {
      customer_id: target.customer_id,
      amount,
      idempotency_key: idempotencyKey,
    };
    setGrantError(null);
    try {
      await postGrant(selected, body);
      if (!isCurrent(selected)) {
        return;
      }
      setTarget(null);
      const summary = await fetchSummary(selected).catch(() => null);
      setBalance(summary?.data.available_balance ?? null);
      await load(selected);
    } catch (err) {
      if (!isCurrent(selected)) {
        return;
      }
      if (isPartnerAccessDenied(err)) {
        await reportAccessDenied();
        return;
      }
      const code = err instanceof ApiError ? err.message : "request_failed";
      if (code === "insufficient_funds") {
        const summary = await fetchSummary(selected).catch(() => null);
        setBalance(summary?.data.available_balance ?? null);
      }
      if (code === "customer_attribution_changed" || code === "customer_not_found") {
        setTarget(null);
        await load(selected);
      }
      setGrantError(partnerErrorMessage(code));
    }
  }

  const visibleRows = rowsForChannel(channelId, loadedId, rows);

  return (
    <section>
      <h1 className="text-xl font-semibold">Customers</h1>
      <form
        className="mt-4 flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          setPage(1);
          void load(channelId, 1, query);
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
      {visibleRows === null && !error ? (
        <p className="mt-4 text-sm text-slate-500">Loading customers…</p>
      ) : null}
      {visibleRows && visibleRows.length === 0 ? (
        <p className="mt-4 text-sm text-slate-600">No customers.</p>
      ) : null}
      {visibleRows && visibleRows.length > 0 ? (
        <ul className="mt-4 divide-y divide-slate-200">
          {visibleRows.map((row) => (
            <li key={row.customer_id} className="flex flex-wrap items-center gap-3 py-3 text-sm">
              <span>{row.customer_id}</span>
              <span>{accountLabel(row.display_name, row.email)}</span>
              <span>{row.attributed_at}</span>
              <span>{row.total_partner_earned}</span>
              <span>{row.accrual_count}</span>
              {context.capabilities.can_grant ? (
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
            void load(channelId, next);
          }}
        >
          Previous
        </button>
        <span className="text-sm">{count} customers</span>
        <button
          type="button"
          className={buttonClassName({ variant: "ghost", size: "sm" })}
          disabled={visibleRows !== null && page * 50 >= count}
          onClick={() => {
            const next = page + 1;
            setPage(next);
            void load(channelId, next);
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
