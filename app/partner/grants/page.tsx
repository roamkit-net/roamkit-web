"use client";

import { useEffect, useState } from "react";

import {
  isPartnerAccessDenied,
  usePartnerPortal,
} from "@/components/partner/PartnerShell";
import { usePartnerChannelGuard } from "@/components/partner/usePartnerChannel";
import { partnerErrorMessage } from "@/lib/partner/errors";
import { buttonClassName } from "@/components/ui/Button";
import { ApiError } from "@/lib/api";
import { accountLabel } from "@/lib/accountLabel";
import { fetchGrants, type PartnerGrant } from "@/lib/partner/client";
import { rowsForChannel } from "@/lib/partner/selection";

function dash(value: string | null): string {
  return value && value.length > 0 ? value : "—";
}

export default function PartnerGrantsPage() {
  const { context, reportAccessDenied } = usePartnerPortal();
  const channelId = context.channel_id;
  const { isCurrent } = usePartnerChannelGuard(channelId);
  const [loadedId, setLoadedId] = useState<string | null>(null);
  const [rows, setRows] = useState<PartnerGrant[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [count, setCount] = useState(0);

  async function load(selected: string, nextPage: number) {
    setRows(null);
    setLoadedId(null);
    setError(null);
    const params = new URLSearchParams({
      page: String(nextPage),
      page_size: "50",
      sort: "created_at",
      order: "desc",
    });
    try {
      const result = await fetchGrants(selected, params);
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
    setPage(1);
    void load(channelId, 1);
    // Reload when the selected channel changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelId]);

  const visibleRows = rowsForChannel(channelId, loadedId, rows);

  return (
    <section>
      <h1 className="text-xl font-semibold">Grants</h1>
      {error ? <p className="mt-4 text-sm text-red-700">{error}</p> : null}
      {visibleRows === null && !error ? (
        <p className="mt-4 text-sm text-slate-500">Loading grants…</p>
      ) : null}
      {visibleRows && visibleRows.length === 0 ? (
        <p className="mt-4 text-sm">No grants.</p>
      ) : null}
      {visibleRows && visibleRows.length > 0 ? (
        <ul className="mt-4 divide-y divide-slate-200 text-sm">
          {visibleRows.map((row) => (
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
            void load(channelId, next);
          }}
        >
          Previous
        </button>
        <span className="text-sm">{count} grants</span>
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
    </section>
  );
}
