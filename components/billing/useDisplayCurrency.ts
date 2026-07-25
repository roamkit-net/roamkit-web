"use client";

import { useContext } from "react";

import {
  DisplayCurrencyContext,
  type DisplayCurrencyContextValue,
} from "@/components/billing/DisplayCurrencyProvider";

/**
 * Access cached public billing display currency (GET …/billing/config/).
 * Must be used under DisplayCurrencyProvider (wired via BillingProvider).
 */
export function useDisplayCurrency(): DisplayCurrencyContextValue {
  const ctx = useContext(DisplayCurrencyContext);
  if (!ctx) {
    throw new Error(
      "useDisplayCurrency must be used within DisplayCurrencyProvider",
    );
  }
  return ctx;
}
