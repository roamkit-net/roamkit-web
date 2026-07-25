"use client";

import type { ReactNode } from "react";

import { BillingProvider } from "@/components/billing/BillingProvider";

type AppProvidersProps = {
  children: ReactNode;
};

/** Root client providers (Query + billing cache). */
export function AppProviders({ children }: AppProvidersProps) {
  return <BillingProvider>{children}</BillingProvider>;
}
