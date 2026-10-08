"use client";

import { useEffect, useState, type ReactNode } from "react";

import { PartnerFrame, PartnerMessage } from "@/components/partner/PartnerFrame";
import { ApiError, isAuthenticated } from "@/lib/api";
import { fetchSummary } from "@/lib/partner/client";
import { loginHref } from "@/lib/navigation/safePath";

export default function PartnerLayout({ children }: { children: ReactNode }) {
  const [gate, setGate] = useState<"loading" | "ready" | "denied" | "ambiguous">(
    "loading",
  );

  useEffect(() => {
    if (!isAuthenticated()) {
      window.location.assign(loginHref(window.location.pathname));
      return;
    }
    let cancelled = false;
    fetchSummary()
      .then(() => {
        if (!cancelled) {
          setGate("ready");
        }
      })
      .catch((error: unknown) => {
        if (cancelled) {
          return;
        }
        const code = error instanceof ApiError ? error.message : "";
        if (code === "partner_context_ambiguous") {
          setGate("ambiguous");
          return;
        }
        setGate("denied");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (gate === "loading") {
    return (
      <PartnerFrame>
        <p className="text-sm text-slate-500">Loading partner portal…</p>
      </PartnerFrame>
    );
  }
  if (gate === "ambiguous") {
    return (
      <PartnerMessage
        title="Contact support"
        body="More than one partner channel matches this login."
      />
    );
  }
  if (gate === "denied") {
    return (
      <PartnerMessage
        title="Access denied"
        body="This login cannot open the partner portal."
      />
    );
  }
  return <PartnerFrame>{children}</PartnerFrame>;
}
