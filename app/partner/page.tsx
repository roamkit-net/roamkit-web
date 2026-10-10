"use client";

import { useEffect, useState } from "react";

import { buttonClassName } from "@/components/ui/Button";
import {
  isPartnerAccessDenied,
  usePartnerPortal,
} from "@/components/partner/PartnerShell";
import { usePartnerChannelGuard } from "@/components/partner/usePartnerChannel";
import { ApiError } from "@/lib/api";
import { partnerErrorMessage } from "@/lib/partner/errors";
import {
  fetchInvite,
  fetchSummary,
  mutateInvite,
  type PartnerInvite,
  type PartnerSummary,
} from "@/lib/partner/client";
import { rowsForChannel } from "@/lib/partner/selection";

export default function PartnerDashboardPage() {
  const { context, reportAccessDenied } = usePartnerPortal();
  const channelId = context.channel_id;
  const { isCurrent } = usePartnerChannelGuard(channelId);
  const [loadedId, setLoadedId] = useState<string | null>(null);
  const [inviteLoadedId, setInviteLoadedId] = useState<string | null>(null);
  const [summary, setSummary] = useState<PartnerSummary | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [invite, setInvite] = useState<PartnerInvite | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoadedId(null);
    setSummary(null);
    setInvite(null);
    setSummaryError(null);
    setInviteError(null);
    const selected = channelId;
    fetchSummary(selected)
      .then((result) => {
        if (cancelled || !isCurrent(selected)) {
          return;
        }
        setSummary(result.data);
        setLoadedId(selected);
      })
      .catch((error: unknown) => {
        if (cancelled || !isCurrent(selected)) {
          return;
        }
        if (isPartnerAccessDenied(error)) {
          void reportAccessDenied();
          return;
        }
        const code = error instanceof ApiError ? error.message : "request_failed";
        setSummaryError(partnerErrorMessage(code));
      });
    fetchInvite(selected)
      .then((result) => {
        if (cancelled || !isCurrent(selected)) {
          return;
        }
        setInvite(result.data);
        setInviteLoadedId(selected);
      })
      .catch((error: unknown) => {
        if (cancelled || !isCurrent(selected)) {
          return;
        }
        if (isPartnerAccessDenied(error)) {
          void reportAccessDenied();
          return;
        }
        const code = error instanceof ApiError ? error.message : "request_failed";
        setInviteError(partnerErrorMessage(code));
      });
    return () => {
      cancelled = true;
    };
  }, [channelId, isCurrent, reportAccessDenied]);

  async function changeInvite(action: "regenerate" | "activate" | "deactivate") {
    const selected = channelId;
    if (action === "regenerate") {
      const confirmed = window.confirm(
        "Regenerate the invite link? The current link stops working immediately.",
      );
      if (!confirmed) {
        return;
      }
    }
    try {
      const result = await mutateInvite(selected, action);
      if (!isCurrent(selected)) {
        return;
      }
      setInvite(result.data);
      setInviteLoadedId(selected);
    } catch (error) {
      if (!isCurrent(selected)) {
        return;
      }
      if (isPartnerAccessDenied(error)) {
        await reportAccessDenied();
        return;
      }
      const code = error instanceof ApiError ? error.message : "request_failed";
      setInviteError(partnerErrorMessage(code));
    }
  }

  const visibleSummary = rowsForChannel(channelId, loadedId, summary);
  const visibleInvite = rowsForChannel(channelId, inviteLoadedId, invite);

  return (
    <div className="grid gap-6">
      <section aria-busy={visibleSummary === null && summaryError === null}>
        <h1 className="text-xl font-semibold">Dashboard</h1>
        {summaryError ? (
          <p className="mt-3 text-sm text-red-700">{summaryError}</p>
        ) : visibleSummary === null ? (
          <p className="mt-3 text-sm text-slate-500">Loading summary…</p>
        ) : (
          <dl className="mt-4 grid gap-3 sm:grid-cols-2">
            <div>
              <dt className="text-sm text-slate-500">Total earned</dt>
              <dd className="text-lg">{visibleSummary.total_earned}</dd>
            </div>
            <div>
              <dt className="text-sm text-slate-500">Available balance</dt>
              <dd className="text-lg">{visibleSummary.available_balance}</dd>
            </div>
            <div className="sm:col-span-2 text-sm">
              Orders {visibleSummary.accrual_counts.order}, top-ups{" "}
              {visibleSummary.accrual_counts.topup}, subscriptions{" "}
              {visibleSummary.accrual_counts.subscription}, total{" "}
              {visibleSummary.accrual_counts.total}
            </div>
          </dl>
        )}
      </section>
      <section aria-busy={visibleInvite === null && inviteError === null}>
        <h2 className="text-lg font-semibold">Invite link</h2>
        {inviteError ? (
          <p className="mt-3 text-sm text-red-700">{inviteError}</p>
        ) : visibleInvite === null ? (
          <p className="mt-3 text-sm text-slate-500">Loading invite…</p>
        ) : (
          <div className="mt-3 grid gap-3">
            <p className="break-all text-sm">{visibleInvite.url}</p>
            <p className="text-sm">{visibleInvite.is_active ? "Active" : "Inactive"}</p>
            <button
              type="button"
              className={buttonClassName({ variant: "secondary", size: "sm" })}
              onClick={() => navigator.clipboard.writeText(visibleInvite.url)}
            >
              Copy link
            </button>
            {context.capabilities.can_manage_invite ? (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className={buttonClassName({ variant: "danger", size: "sm" })}
                  onClick={() => changeInvite("regenerate")}
                >
                  Regenerate
                </button>
                {visibleInvite.is_active ? (
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
