"use client";

import { useEffect, useState } from "react";

import { ApiError } from "@/lib/api";
import {
  fetchInvite,
  fetchSummary,
  mutateInvite,
  type PartnerInvite,
  type PartnerRole,
  type PartnerSummary,
} from "@/lib/partner/client";
import { buttonClassName } from "@/components/ui/Button";

export default function PartnerDashboardPage() {
  const [summary, setSummary] = useState<PartnerSummary | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [invite, setInvite] = useState<PartnerInvite | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [role, setRole] = useState<PartnerRole>("");

  useEffect(() => {
    let cancelled = false;
    fetchSummary()
      .then((result) => {
        if (!cancelled) {
          setSummary(result.data);
          setRole(result.role);
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setSummaryError(error instanceof ApiError ? error.message : "request_failed");
        }
      });
    fetchInvite()
      .then((result) => {
        if (!cancelled) {
          setInvite(result.data);
          setRole((current) => current || result.role);
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setInviteError(error instanceof ApiError ? error.message : "request_failed");
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function changeInvite(action: "regenerate" | "activate" | "deactivate") {
    if (action === "regenerate") {
      const confirmed = window.confirm(
        "Regenerate the invite link? The current link stops working immediately.",
      );
      if (!confirmed) {
        return;
      }
    }
    const result = await mutateInvite(action);
    setInvite(result.data);
    setRole(result.role);
  }

  return (
    <div className="grid gap-6">
      <section aria-busy={summary === null && summaryError === null}>
        <h1 className="text-xl font-semibold">Dashboard</h1>
        {summaryError ? (
          <p className="mt-3 text-sm text-red-700">{summaryError}</p>
        ) : summary === null ? (
          <p className="mt-3 text-sm text-slate-500">Loading summary…</p>
        ) : (
          <dl className="mt-4 grid gap-3 sm:grid-cols-2">
            <div>
              <dt className="text-sm text-slate-500">Total earned</dt>
              <dd className="text-lg">{summary.total_earned}</dd>
            </div>
            <div>
              <dt className="text-sm text-slate-500">Available balance</dt>
              <dd className="text-lg">{summary.available_balance}</dd>
            </div>
            <div className="sm:col-span-2 text-sm">
              Orders {summary.accrual_counts.order}, top-ups{" "}
              {summary.accrual_counts.topup}, subscriptions{" "}
              {summary.accrual_counts.subscription}, total{" "}
              {summary.accrual_counts.total}
            </div>
          </dl>
        )}
      </section>
      <section aria-busy={invite === null && inviteError === null}>
        <h2 className="text-lg font-semibold">Invite link</h2>
        {inviteError ? (
          <p className="mt-3 text-sm text-red-700">{inviteError}</p>
        ) : invite === null ? (
          <p className="mt-3 text-sm text-slate-500">Loading invite…</p>
        ) : (
          <div className="mt-3 grid gap-3">
            <p className="break-all text-sm">{invite.url}</p>
            <p className="text-sm">
              {invite.is_active ? "Active" : "Inactive"}
            </p>
            <button
              type="button"
              className={buttonClassName({ variant: "secondary", size: "sm" })}
              onClick={() => navigator.clipboard.writeText(invite.url)}
            >
              Copy link
            </button>
            {role === "owner" ? (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className={buttonClassName({ variant: "danger", size: "sm" })}
                  onClick={() => changeInvite("regenerate")}
                >
                  Regenerate
                </button>
                {invite.is_active ? (
                  <button
                    type="button"
                    className={buttonClassName({ variant: "secondary", size: "sm" })}
                    onClick={() => changeInvite("deactivate")}
                  >
                    Deactivate
                  </button>
                ) : (
                  <button
                    type="button"
                    className={buttonClassName({ variant: "primary", size: "sm" })}
                    onClick={() => changeInvite("activate")}
                  >
                    Activate
                  </button>
                )}
              </div>
            ) : null}
          </div>
        )}
      </section>
    </div>
  );
}
