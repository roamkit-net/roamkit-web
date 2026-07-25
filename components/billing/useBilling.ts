"use client";

import { useContext } from "react";

import {
  BillingContext,
  type BillingContextValue,
} from "@/components/billing/BillingProvider";

/**
 * Access shared billing cache (balance, config, features).
 * Must be used under BillingProvider.
 */
export function useBilling(): BillingContextValue {
  const ctx = useContext(BillingContext);
  if (!ctx) {
    throw new Error("useBilling must be used within BillingProvider");
  }
  return ctx;
}
