"use client";

import {
  useEffect,
  useId,
  useRef,
  type RefObject,
} from "react";

import { useBilling } from "@/components/billing/useBilling";
import { TokenIcon } from "@/components/billing/TokenIcon";
import { CatalogPriceDisplay } from "@/components/CatalogPriceDisplay";
import { Button } from "@/components/ui/Button";
import { formatCredits } from "@/lib/billing/format";

/**
 * Generic purchase summary — not tied to eSIM packages.
 * Reusable later for vouchers, subscriptions, add-ons, marketplace.
 */
export type PurchaseSummary = {
  title: string;
  dataLabel: string;
  validityLabel: string;
  priceUsd: string;
};

export type PurchaseConfirmDialogProps = {
  summary: PurchaseSummary;
  isPurchasing: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  /** Buy button that opened the dialog — focused when the dialog closes. */
  returnFocusRef?: RefObject<HTMLElement | null>;
};

function ConfirmSpinner() {
  return (
    <span
      aria-hidden="true"
      data-testid="purchase-confirm-spinner"
      className="inline-block h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-white/30 border-t-white"
    />
  );
}

/**
 * Confirm before prepaid spend (ledger debit). Displayed balance is
 * informational only — CreditService re-checks funds on the API.
 */
export function PurchaseConfirmDialog({
  summary,
  isPurchasing,
  onCancel,
  onConfirm,
  returnFocusRef,
}: PurchaseConfirmDialogProps) {
  const titleId = useId();
  const descriptionId = useId();
  const confirmRef = useRef<HTMLButtonElement>(null);
  const submittedRef = useRef(false);
  const { balance, config } = useBilling();

  useEffect(() => {
    if (!isPurchasing) {
      submittedRef.current = false;
    }
  }, [isPurchasing]);

  useEffect(() => {
    confirmRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusTarget = returnFocusRef?.current ?? null;
    return () => {
      document.body.style.overflow = previousOverflow;
      focusTarget?.focus?.();
    };
  }, [returnFocusRef]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isPurchasing) {
        onCancel();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isPurchasing, onCancel]);

  function handleConfirm() {
    if (isPurchasing || submittedRef.current) {
      return;
    }
    submittedRef.current = true;
    onConfirm();
  }

  function handleBackdropClick() {
    if (isPurchasing) {
      return;
    }
    onCancel();
  }

  const tokenSymbol = config?.tokenSymbol ?? "credits";
  const balanceAmount =
    balance != null ? formatCredits(balance) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0 bg-slate-900/40"
        onClick={handleBackdropClick}
        disabled={isPurchasing}
        tabIndex={isPurchasing ? -1 : 0}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="relative z-10 flex max-h-[85vh] w-full max-w-md flex-col rounded-t-2xl bg-white shadow-xl sm:rounded-2xl"
      >
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 id={titleId} className="text-lg font-semibold text-slate-900">
            Confirm purchase
          </h2>
        </div>

        <div
          id={descriptionId}
          className="space-y-3 px-5 py-4 text-sm text-slate-700"
        >
          <p className="text-base font-semibold text-slate-900">
            {summary.title}
          </p>
          <dl className="space-y-2">
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Data</dt>
              <dd className="font-medium text-slate-900">{summary.dataLabel}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Validity</dt>
              <dd className="font-medium text-slate-900">
                {summary.validityLabel}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Price</dt>
              <dd className="font-semibold text-slate-900">
                <CatalogPriceDisplay amount={summary.priceUsd} />
              </dd>
            </div>
            {balanceAmount ? (
              <div className="flex justify-between gap-4 border-t border-slate-100 pt-2">
                <dt className="text-slate-500">Your balance</dt>
                <dd className="tabular-nums font-medium text-slate-900">
                  <span className="inline-flex items-center gap-1 whitespace-nowrap">
                    <TokenIcon size="sm" />
                    <span>
                      {balanceAmount} {tokenSymbol}
                    </span>
                  </span>
                </dd>
              </div>
            ) : null}
          </dl>
          <p className="text-xs leading-5 text-slate-500">
            Balance is shown for reference. Available funds are checked again
            when you confirm.
          </p>
        </div>

        <div className="sticky bottom-0 flex gap-3 border-t border-slate-200 bg-white px-5 py-4">
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={onCancel}
            disabled={isPurchasing}
            className="min-h-11 flex-1"
          >
            Cancel
          </Button>
          <Button
            ref={confirmRef}
            type="button"
            variant="primary"
            size="md"
            onClick={handleConfirm}
            disabled={isPurchasing}
            aria-busy={isPurchasing}
            className="min-h-11 flex-1"
          >
            {isPurchasing ? (
              <>
                <ConfirmSpinner />
                Purchasing…
              </>
            ) : (
              "Confirm purchase"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function validityLabelFromDays(days: number): string {
  if (days === 1) {
    return "1 day";
  }
  return `${days} days`;
}

export function dataLabelFromPackage(opts: {
  is_unlimited: boolean;
  data_allowance: string;
}): string {
  return opts.is_unlimited ? "Unlimited" : opts.data_allowance;
}
