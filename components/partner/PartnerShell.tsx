"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { PartnerFrame, PartnerMessage } from "@/components/partner/PartnerFrame";
import { ApiError, isAuthenticated } from "@/lib/api";
import { fetchPartnerContexts } from "@/lib/partner/client";
import { partnerErrorMessage } from "@/lib/partner/errors";
import { loginHref } from "@/lib/navigation/safePath";
import {
  choosePartnerContext,
  clearStoredPartnerChannelId,
  partnerChooseNotice,
  partnerContextLabel,
  readStoredPartnerChannelId,
  recoverPartnerContext,
  writeStoredPartnerChannelId,
  type PartnerContextItem,
  type PartnerSelection,
} from "@/lib/partner/selection";

type PortalValue = {
  context: PartnerContextItem;
  contexts: PartnerContextItem[];
  selectChannel: (channelId: string) => void;
  reportAccessDenied: () => Promise<void>;
};

const PortalContext = createContext<PortalValue | null>(null);

export function usePartnerPortal(): PortalValue {
  const value = useContext(PortalContext);
  if (value === null) {
    throw new Error("Partner portal is not selected");
  }
  return value;
}

export function PartnerContextPicker({
  contexts,
  value,
  onSelect,
}: {
  contexts: PartnerContextItem[];
  value: string;
  onSelect: (channelId: string) => void;
}) {
  const optionClass = "bg-[var(--app-surface)] text-[var(--app-chrome-text)]";
  return (
    <select
      aria-label="Organization"
      className="rounded-lg border border-[var(--app-border-chrome)] bg-[var(--app-surface)] px-3 py-2 text-sm text-[var(--app-chrome-text)] [color-scheme:dark]"
      value={value}
      onChange={(event) => onSelect(event.target.value)}
    >
      {value === "" ? (
        <option className={optionClass} value="">
          Select a channel
        </option>
      ) : null}
      {contexts.map((item) => (
        <option key={item.channel_id} className={optionClass} value={item.channel_id}>
          {partnerContextLabel(item)}
        </option>
      ))}
    </select>
  );
}

export function PartnerShell({ children }: { children: ReactNode }) {
  const [selection, setSelection] = useState<PartnerSelection | "loading">("loading");
  const [contexts, setContexts] = useState<PartnerContextItem[]>([]);
  const [notice, setNotice] = useState<string | null>(null);

  const apply = useCallback(
    (
      next: PartnerSelection,
      items: PartnerContextItem[],
      storedChannelId: string | null,
    ) => {
      setContexts(items);
      setSelection(next);
      if (next.status === "ready") {
        writeStoredPartnerChannelId(next.context.channel_id);
        setNotice(
          next.announced
            ? `This organization is no longer available. The remaining organization is ${next.context.label}.`
            : null,
        );
        return;
      }
      clearStoredPartnerChannelId();
      setNotice(next.status === "choose" ? partnerChooseNotice(storedChannelId) : null);
    },
    [],
  );

  useEffect(() => {
    if (!isAuthenticated()) {
      window.location.assign(loginHref(window.location.pathname));
      return;
    }
    let cancelled = false;
    fetchPartnerContexts()
      .then((result) => {
        if (cancelled) {
          return;
        }
        const items = result.data.contexts;
        const stored = readStoredPartnerChannelId();
        apply(choosePartnerContext(items, stored), items, stored);
      })
      .catch((error: unknown) => {
        if (cancelled) {
          return;
        }
        if (error instanceof ApiError && error.message === "partner_channel_disabled") {
          setNotice(partnerErrorMessage("partner_channel_disabled"));
        }
        setSelection({ status: "unavailable" });
      });
    return () => {
      cancelled = true;
    };
  }, [apply]);

  const selectChannel = useCallback(
    (channelId: string) => {
      const next = contexts.find((item) => item.channel_id === channelId);
      if (!next) {
        return;
      }
      writeStoredPartnerChannelId(channelId);
      setNotice(null);
      setSelection({ status: "ready", context: next, announced: false });
    },
    [contexts],
  );

  const reportAccessDenied = useCallback(async () => {
    const denied =
      selection !== "loading" && selection.status === "ready"
        ? selection.context.channel_id
        : readStoredPartnerChannelId();
    clearStoredPartnerChannelId();
    try {
      const result = await fetchPartnerContexts();
      const items = result.data.contexts;
      apply(recoverPartnerContext(items, denied ?? ""), items, denied);
    } catch {
      setSelection({ status: "unavailable" });
    }
  }, [apply, selection]);

  const portal = useMemo<PortalValue | null>(() => {
    if (selection === "loading" || selection.status !== "ready") {
      return null;
    }
    return {
      context: selection.context,
      contexts,
      selectChannel,
      reportAccessDenied,
    };
  }, [contexts, reportAccessDenied, selectChannel, selection]);

  if (selection === "loading") {
    return (
      <PartnerFrame>
        <p className="text-sm text-slate-500">Loading partner portal…</p>
      </PartnerFrame>
    );
  }
  if (selection.status === "unavailable") {
    return (
      <PartnerMessage
        title={notice ? "Partner portal" : "No partner channel"}
        body={notice ?? "This login has no partner channel."}
      />
    );
  }
  if (selection.status === "choose" || portal === null) {
    return (
      <PartnerFrame>
        <h1 className="text-lg font-semibold">Which organization are you opening?</h1>
        <div className="mt-4 max-w-md">
          <PartnerContextPicker
            contexts={contexts}
            value=""
            onSelect={selectChannel}
          />
        </div>
        {notice ? <p className="mt-3 text-sm text-slate-600">{notice}</p> : null}
      </PartnerFrame>
    );
  }

  return (
    <PortalContext.Provider value={portal}>
      <PartnerFrame
        role={portal.context.effective_role}
        switcher={
          contexts.length > 1 ? (
            <PartnerContextPicker
              contexts={contexts}
              value={portal.context.channel_id}
              onSelect={selectChannel}
            />
          ) : null
        }
      >
        {notice ? <p className="mt-3 text-sm text-slate-600">{notice}</p> : null}
        {portal.context.is_active ? null : (
          <p className="mt-3 text-sm text-amber-800">
            This partner channel is paused. History stays available. New commission is not accruing.
          </p>
        )}
        {children}
      </PartnerFrame>
    </PortalContext.Provider>
  );
}

export function isPartnerAccessDenied(error: unknown): boolean {
  return error instanceof ApiError && error.message === "partner_access_denied";
}
