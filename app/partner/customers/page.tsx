"use client";

import { Fragment, useEffect, useState } from "react";

import {
  isPartnerAccessDenied,
  usePartnerPortal,
} from "@/components/partner/PartnerShell";
import { usePartnerChannelGuard } from "@/components/partner/usePartnerChannel";
import { partnerErrorMessage } from "@/lib/partner/errors";
import {
  CustomerPlansPanel,
  CustomerPlansToggle,
  customerPlansPanelId,
} from "@/components/partner/CustomerPlans";
import { Alert } from "@/components/ui/Alert";
import { buttonClassName } from "@/components/ui/Button";
import { Card, CardSection } from "@/components/ui/Card";
import { Empty } from "@/components/ui/Empty";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { accountLabel } from "@/lib/accountLabel";
import { ApiError } from "@/lib/api";
import { formatCredits } from "@/lib/billing/format";
import {
  fetchCustomerPlans,
  fetchCustomers,
  fetchSummary,
  postGrant,
  type PartnerCustomer,
  type PartnerCustomerPlans,
} from "@/lib/partner/client";
import { customerColumnCount, plansCacheKey } from "@/lib/partner/customerPlans";
import { rowsForChannel } from "@/lib/partner/selection";

const PAGE_SIZE = 50;

type PlansEntry =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "loaded"; data: PartnerCustomerPlans };

function formatAttributed(value: string | null | undefined): string {
  if (!value) {
    return "—";
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "—";
  }
  return parsed.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function CustomersTableSkeleton() {
  return (
    <div role="status" aria-live="polite" aria-busy="true" className="divide-y divide-slate-100">
      <span className="sr-only">Loading customers…</span>
      {Array.from({ length: 4 }, (_, index) => (
        <div key={index} className="flex items-center gap-6 px-4 py-4">
          <div className="min-w-0 flex-1">
            <Skeleton variant="line" className="h-4 w-40" />
            <Skeleton variant="line" className="mt-2 h-3 w-56 max-w-full" />
          </div>
          <Skeleton variant="line" className="hidden h-4 w-32 sm:block" />
          <Skeleton variant="line" className="h-4 w-16" />
          <Skeleton variant="line" className="h-4 w-8" />
        </div>
      ))}
    </div>
  );
}

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
  const [openCustomerId, setOpenCustomerId] = useState<number | null>(null);
  const [plansByKey, setPlansByKey] = useState<Record<string, PlansEntry>>({});

  useEffect(() => {
    setOpenCustomerId(null);
    setPlansByKey({});
  }, [channelId]);

  async function loadPlans(customerId: number) {
    const requested = channelId;
    const key = plansCacheKey(requested, customerId);
    setPlansByKey((current) => ({ ...current, [key]: { status: "loading" } }));
    try {
      const result = await fetchCustomerPlans(requested, customerId);
      if (!isCurrent(requested)) {
        return;
      }
      setPlansByKey((current) => ({
        ...current,
        [key]: { status: "loaded", data: result.data },
      }));
    } catch (err) {
      if (!isCurrent(requested)) {
        return;
      }
      const code = err instanceof ApiError ? err.message : "request_failed";
      setPlansByKey((current) => ({
        ...current,
        [key]: { status: "error", message: partnerErrorMessage(code) },
      }));
    }
  }

  function togglePlans(customerId: number) {
    if (openCustomerId === customerId) {
      setOpenCustomerId(null);
      return;
    }
    setOpenCustomerId(customerId);
    const key = plansCacheKey(channelId, customerId);
    if (plansByKey[key]?.status === "loaded") {
      return;
    }
    void loadPlans(customerId);
  }

  async function load(selected: string, nextPage = page, nextQuery = query) {
    setError(null);
    setLoadedId(null);
    setRows(null);
    const params = new URLSearchParams({
      page: String(nextPage),
      page_size: String(PAGE_SIZE),
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
  const canGrant = context.capabilities.can_grant;
  const canViewPlans = context.capabilities.can_view_customer_plans;
  const role = context.effective_role;
  const sample = visibleRows?.[0];
  const showBalance = sample
    ? Object.prototype.hasOwnProperty.call(sample, "credit_balance")
    : role === "owner" || role === "admin" || role === "member";
  const showEarned = sample
    ? Object.prototype.hasOwnProperty.call(sample, "total_partner_earned")
    : role === "owner" || role === "admin";
  const showAccruals = sample
    ? Object.prototype.hasOwnProperty.call(sample, "accrual_count")
    : role === "owner" || role === "admin" || role === "member";
  const rangeStart = (page - 1) * PAGE_SIZE;
  const rangeLabel =
    visibleRows === null
      ? ""
      : visibleRows.length > 0
        ? `${rangeStart + 1}–${rangeStart + visibleRows.length} of ${count}`
        : `0 of ${count}`;
  const columnCount = customerColumnCount({
    showBalance,
    showEarned,
    showAccruals,
    canGrant,
  });

  return (
    <section>
      <h1 className="text-xl font-semibold">Customers</h1>
      <Card className="mt-4 overflow-hidden">
        <form
          className="flex items-end gap-2 border-b border-[var(--app-border)] px-4 py-4"
          onSubmit={(event) => {
            event.preventDefault();
            setPage(1);
            void load(channelId, 1, query);
          }}
        >
          <label className="sr-only" htmlFor="customer-q">
            Search customers
          </label>
          <div className="min-w-0 flex-1 sm:max-w-xs">
            <Input
              id="customer-q"
              tone="app"
              value={query}
              placeholder="Search customers"
              onChange={(event) => setQuery(event.target.value)}
              className="text-sm"
            />
          </div>
          <button type="submit" className={buttonClassName({ size: "sm" })}>
            Search
          </button>
        </form>

        {error ? (
          <CardSection>
            <Alert variant="error" size="sm">
              {error}
            </Alert>
          </CardSection>
        ) : null}
        {visibleRows === null && !error ? <CustomersTableSkeleton /> : null}
        {visibleRows && visibleRows.length === 0 ? (
          <CardSection padding="lg">
            <Empty compact title="No customers found" />
          </CardSection>
        ) : null}
        {visibleRows && visibleRows.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-[var(--app-border)] bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Customer
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Attributed
                  </th>
                  {showBalance ? (
                    <th scope="col" className="px-4 py-3 text-right font-medium">
                      Balance
                    </th>
                  ) : null}
                  {showEarned ? (
                    <th scope="col" className="px-4 py-3 text-right font-medium">
                      Earned
                    </th>
                  ) : null}
                  {showAccruals ? (
                    <th scope="col" className="px-4 py-3 text-right font-medium">
                      Accruals
                    </th>
                  ) : null}
                  {canGrant ? (
                    <th scope="col" className="px-4 py-3 text-right font-medium">
                      <span className="sr-only">Actions</span>
                    </th>
                  ) : null}
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((row) => {
                  const label = accountLabel(row.display_name, row.email);
                  const plansId = customerPlansPanelId(row.customer_id);
                  const plansKey = plansCacheKey(channelId, row.customer_id);
                  const expanded = canViewPlans && openCustomerId === row.customer_id;
                  const plansState = plansByKey[plansKey];
                  return (
                    <Fragment key={row.customer_id}>
                    <tr
                      className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                    >
                      <td className="min-w-[12rem] px-4 py-3">
                        <div className="flex items-start">
                          <CustomerPlansToggle
                            canView={canViewPlans}
                            label={label}
                            expanded={expanded}
                            controlsId={plansId}
                            onClick={() => togglePlans(row.customer_id)}
                          />
                          <div>
                            <p className="font-medium text-slate-900">{label}</p>
                            {row.email && row.email !== label ? (
                              <p className="text-xs text-slate-500">{row.email}</p>
                            ) : null}
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                        {formatAttributed(row.attributed_at)}
                      </td>
                      {showBalance ? (
                        <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-slate-700">
                          {row.credit_balance == null ? "—" : formatCredits(row.credit_balance)}
                        </td>
                      ) : null}
                      {showEarned ? (
                        <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-slate-700">
                          {row.total_partner_earned == null
                            ? "—"
                            : formatCredits(row.total_partner_earned)}
                        </td>
                      ) : null}
                      {showAccruals ? (
                        <td className="px-4 py-3 text-right tabular-nums text-slate-700">
                          {row.accrual_count ?? "—"}
                        </td>
                      ) : null}
                      {canGrant ? (
                        <td className="whitespace-nowrap px-4 py-3 text-right">
                          <button
                            type="button"
                            className={buttonClassName({ variant: "secondary", size: "sm" })}
                            onClick={() => openGrant(row)}
                          >
                            Give credit
                          </button>
                        </td>
                      ) : null}
                    </tr>
                    {expanded && plansState ? (
                      <tr className="border-b border-slate-100 bg-slate-50">
                        <td colSpan={columnCount} className="px-4 py-3">
                          <CustomerPlansPanel
                            id={plansId}
                            state={plansState}
                            onRetry={() => void loadPlans(row.customer_id)}
                          />
                        </td>
                      </tr>
                    ) : null}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--app-border)] px-4 py-3">
          <p className="text-sm tabular-nums text-slate-600">{rangeLabel}</p>
          <div className="flex gap-2">
            <button
              type="button"
              className={buttonClassName({ variant: "secondary", size: "sm" })}
              disabled={page <= 1}
              onClick={() => {
                const next = page - 1;
                setPage(next);
                void load(channelId, next);
              }}
            >
              Previous
            </button>
            <button
              type="button"
              className={buttonClassName({ variant: "secondary", size: "sm" })}
              disabled={visibleRows !== null && page * PAGE_SIZE >= count}
              onClick={() => {
                const next = page + 1;
                setPage(next);
                void load(channelId, next);
              }}
            >
              Next
            </button>
          </div>
        </div>

        {target ? (
          <CardSection divider>
            <div role="dialog" aria-modal="true" aria-labelledby="grant-title">
              <h2 id="grant-title" className="font-semibold">
                Give credit
              </h2>
              <p className="mt-2 text-sm">{accountLabel(target.display_name, target.email)}</p>
              <p className="text-sm text-slate-600">
                Available balance{" "}
                <span className="tabular-nums">{balance ?? "…"}</span>
              </p>
              <label className="mt-3 block text-sm font-medium" htmlFor="grant-amount">
                Amount
              </label>
              <div className="sm:max-w-xs">
                <Input
                  id="grant-amount"
                  tone="app"
                  value={amount}
                  onChange={(event) => onAmount(event.target.value)}
                  className="text-sm"
                />
              </div>
              {grantError ? (
                <Alert variant="error" size="sm" className="mt-3">
                  {grantError}
                </Alert>
              ) : null}
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
          </CardSection>
        ) : null}
      </Card>
    </section>
  );
}
