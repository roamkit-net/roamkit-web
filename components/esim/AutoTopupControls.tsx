"use client";

import { useEffect, useId, useRef, useState } from "react";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import {
  ErrorMessage,
  Field,
  HelpText,
  Label,
} from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import {
  ApiError,
  deleteMyEsimAutoTopup,
  fetchMyEsimAutoTopup,
  putMyEsimAutoTopup,
  type TopupPackage,
} from "@/lib/api";
import {
  activeUntilFromUiDate,
  uiDateFromActiveUntil,
} from "@/lib/esim/autoTopupActiveUntil";
import type {
  AutoTopupPolicy,
  AutoTopupRenewMode,
  AutoTopupUsageMode,
} from "@/types/autoTopup";

const DEFAULT_THRESHOLD_MB = 500;
const DEFAULT_REMAINING_COUNT = 3;
const SAVED_BANNER_MS = 2000;

const REASON_LABEL: Record<string, string> = {
  insufficient_funds: "Paused — not enough credits for the next auto top-up.",
  package_unavailable:
    "Blocked — the selected package is no longer available.",
  usage_unknown: "Paused — usage data is unavailable.",
  provider_error: "Paused — the provider returned an error.",
  manual_pause: "Disabled by you.",
  count_exhausted: "Paused — renewal count reached.",
  schedule_ended: "Paused — policy end date reached.",
};

type AutoTopupControlsProps = {
  esimId: number | string;
  topups: TopupPackage[];
};

type Draft = {
  enabled: boolean;
  packageId: string;
  expiryEnabled: boolean;
  /** UI: remaining-data condition selected (maps to usage_mode ≠ disabled). */
  remainingDataEnabled: boolean;
  /** threshold | zero when remainingDataEnabled; ignored otherwise. */
  usageKind: "threshold" | "zero";
  thresholdMb: string;
  renewMode: AutoTopupRenewMode;
  remainingCount: string;
  /** UI calendar date YYYY-MM-DD; empty = no schedule limit. */
  activeUntilDate: string;
};

function usageTriggersAllowed(pkg: TopupPackage | undefined): boolean {
  return pkg != null && !pkg.is_unlimited;
}

function usageModeFromDraft(
  draft: Draft,
  canUseRemainingData: boolean,
): AutoTopupUsageMode {
  if (!canUseRemainingData || !draft.remainingDataEnabled) {
    return "disabled";
  }
  return draft.usageKind;
}

function draftFromPolicy(
  policy: AutoTopupPolicy | null,
  fallbackPackageId: string,
): Draft {
  if (!policy) {
    return {
      enabled: false,
      packageId: fallbackPackageId,
      expiryEnabled: true,
      remainingDataEnabled: false,
      usageKind: "threshold",
      thresholdMb: String(DEFAULT_THRESHOLD_MB),
      renewMode: "until_funds",
      remainingCount: String(DEFAULT_REMAINING_COUNT),
      activeUntilDate: "",
    };
  }
  const usageMode = policy.usage_mode;
  const remainingDataEnabled = usageMode !== "disabled";
  return {
    enabled: policy.enabled && policy.status !== "disabled",
    packageId: policy.package_id,
    expiryEnabled: policy.expiry_enabled,
    remainingDataEnabled,
    usageKind: usageMode === "zero" ? "zero" : "threshold",
    thresholdMb: String(policy.threshold_mb ?? DEFAULT_THRESHOLD_MB),
    renewMode: policy.renew_mode,
    remainingCount: String(
      policy.remaining_count ?? DEFAULT_REMAINING_COUNT,
    ),
    activeUntilDate: uiDateFromActiveUntil(policy.active_until),
  };
}

function statusBanner(
  policy: AutoTopupPolicy | null,
): { variant: "info" | "warning" | "error" | "success"; text: string } | null {
  if (!policy) {
    return null;
  }
  if (policy.status === "active" && policy.enabled) {
    return {
      variant: "success",
      text: "Auto top-up is on for this eSIM.",
    };
  }
  const reasonText =
    (policy.reason && REASON_LABEL[policy.reason]) ||
    (policy.reason ? `Status: ${policy.status} (${policy.reason}).` : null);
  if (policy.status === "blocked") {
    return {
      variant: "error",
      text: reasonText ?? "Auto top-up is blocked.",
    };
  }
  if (policy.status === "paused" || policy.status === "disabled") {
    return {
      variant: "warning",
      text: reasonText ?? `Auto top-up is ${policy.status}.`,
    };
  }
  return reasonText
    ? { variant: "info", text: reasonText }
    : null;
}

function formatApiError(error: unknown, fallback: string): string {
  if (!(error instanceof ApiError)) {
    return fallback;
  }
  if (error.status === 404) {
    return "Auto top-up is not available yet.";
  }
  if (error.status === 409) {
    const body = error.body;
    if (body && typeof body === "object") {
      const record = body as Record<string, unknown>;
      if (record.code === "SPEND_IN_PROGRESS") {
        return "A top-up is still in progress. Try again in a moment.";
      }
    }
    return "This policy changed elsewhere. Reload and try again.";
  }
  if (error.status === 403) {
    return "Auto top-up is not enabled for your account yet.";
  }
  const body = error.body;
  if (body && typeof body === "object") {
    const record = body as Record<string, unknown>;
    if (typeof record.detail === "string") {
      return record.detail;
    }
    const activeUntilErr = record.active_until;
    if (typeof activeUntilErr === "string") {
      return activeUntilErr;
    }
    if (
      Array.isArray(activeUntilErr) &&
      typeof activeUntilErr[0] === "string"
    ) {
      return activeUntilErr[0];
    }
  }
  return error.message || fallback;
}

export function AutoTopupControls({
  esimId,
  topups,
}: AutoTopupControlsProps) {
  const formId = useId();
  const [policy, setPolicy] = useState<AutoTopupPolicy | null>(null);
  const [draft, setDraft] = useState<Draft>(() =>
    draftFromPolicy(null, topups[0]?.id ?? ""),
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSaved, setShowSaved] = useState(false);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);
  const expiryCheckboxRef = useRef<HTMLInputElement>(null);
  const packageSelectRef = useRef<HTMLSelectElement>(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (savedTimerRef.current) {
        clearTimeout(savedTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    setUnavailable(false);

    void (async () => {
      try {
        const loaded = await fetchMyEsimAutoTopup(esimId);
        if (cancelled) {
          return;
        }
        setPolicy(loaded);
        setDraft(draftFromPolicy(loaded, topups[0]?.id ?? ""));
      } catch (err) {
        if (cancelled) {
          return;
        }
        if (err instanceof ApiError && err.status === 404) {
          setPolicy(null);
          setDraft(draftFromPolicy(null, topups[0]?.id ?? ""));
          return;
        }
        setPolicy(null);
        setDraft(draftFromPolicy(null, topups[0]?.id ?? ""));
        setError(formatApiError(err, "Unable to load auto top-up."));
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
    // Re-load when the available package set for this eSIM changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- topups[0]?.id covers list identity
  }, [esimId, topups[0]?.id]);

  // Clear Remaining-data when selected package is (or becomes) unlimited —
  // covers select change, policy load, and topups refetch/reload.
  useEffect(() => {
    const pkg = topups.find((item) => item.id === draft.packageId);
    if (usageTriggersAllowed(pkg)) {
      return;
    }
    setDraft((prev) => {
      if (!prev.remainingDataEnabled) {
        return prev;
      }
      queueMicrotask(() => {
        const target =
          expiryCheckboxRef.current ?? packageSelectRef.current;
        target?.focus();
      });
      return { ...prev, remainingDataEnabled: false };
    });
  }, [draft.packageId, draft.remainingDataEnabled, topups]);

  if (topups.length === 0) {
    return null;
  }

  const banner = statusBanner(policy);
  const selectedPackage = topups.find((pkg) => pkg.id === draft.packageId);
  const canUseRemainingData = usageTriggersAllowed(selectedPackage);
  const remainingDataActive =
    canUseRemainingData && draft.remainingDataEnabled;
  const hasValidCondition =
    draft.expiryEnabled || remainingDataActive;
  const packageMissing =
    Boolean(draft.packageId) && selectedPackage == null;
  const showOrHelper = draft.expiryEnabled && remainingDataActive;
  const saveBlockedForConditions = draft.enabled && !hasValidCondition;

  async function handleSave() {
    setError(null);
    setShowSaved(false);

    if (!draft.packageId || packageMissing) {
      setError("Choose a package from Available top-ups.");
      return;
    }

    const usageMode = usageModeFromDraft(draft, canUseRemainingData);
    if (draft.enabled && !hasValidCondition) {
      setError("Select at least one condition.");
      return;
    }

    const thresholdMb =
      usageMode === "threshold"
        ? Number.parseInt(draft.thresholdMb, 10)
        : null;
    if (
      usageMode === "threshold" &&
      (!Number.isFinite(thresholdMb) || (thresholdMb as number) < 1)
    ) {
      setError("Enter a threshold of at least 1 MB.");
      return;
    }

    const remainingCount =
      draft.renewMode === "fixed_count"
        ? Number.parseInt(draft.remainingCount, 10)
        : null;
    if (
      draft.renewMode === "fixed_count" &&
      (!Number.isFinite(remainingCount) || (remainingCount as number) < 0)
    ) {
      setError("Enter a renewal count of 0 or more.");
      return;
    }

    let activeUntil: string | null = null;
    if (draft.activeUntilDate.trim()) {
      activeUntil = activeUntilFromUiDate(draft.activeUntilDate);
      if (activeUntil == null) {
        setError("Enter a valid policy end date.");
        return;
      }
      if (Date.now() >= Date.parse(activeUntil)) {
        setError("Policy end date must be today or in the future.");
        return;
      }
    }

    setIsSaving(true);
    try {
      if (!draft.enabled && policy) {
        await deleteMyEsimAutoTopup(esimId, policy.version);
        if (!mountedRef.current) {
          return;
        }
        setPolicy(null);
        setDraft(draftFromPolicy(null, topups[0]?.id ?? draft.packageId));
      } else if (draft.enabled) {
        const body = {
          package_id: draft.packageId,
          enabled: true,
          expiry_enabled: draft.expiryEnabled,
          usage_mode: usageMode,
          threshold_mb: thresholdMb,
          renew_mode: draft.renewMode,
          remaining_count: remainingCount,
          active_until: activeUntil,
          version: policy?.version ?? null,
        };
        const saved = await putMyEsimAutoTopup(esimId, body, {
          ifMatch: policy?.version ?? null,
        });
        if (!mountedRef.current) {
          return;
        }
        setPolicy(saved);
        setDraft(draftFromPolicy(saved, topups[0]?.id ?? ""));
      } else {
        // Disabled with no existing policy — nothing to persist.
        if (!mountedRef.current) {
          return;
        }
      }

      setShowSaved(true);
      if (savedTimerRef.current) {
        clearTimeout(savedTimerRef.current);
      }
      savedTimerRef.current = setTimeout(() => {
        if (mountedRef.current) {
          setShowSaved(false);
        }
      }, SAVED_BANNER_MS);
    } catch (err) {
      if (!mountedRef.current) {
        return;
      }
      if (err instanceof ApiError && err.status === 404) {
        setUnavailable(true);
      }
      setError(formatApiError(err, "Unable to save auto top-up."));
    } finally {
      if (mountedRef.current) {
        setIsSaving(false);
      }
    }
  }

  if (isLoading) {
    return (
      <div className="mt-6 border-t border-slate-100 pt-5">
        <p className="text-sm text-slate-600">Loading auto top-up…</p>
      </div>
    );
  }

  if (unavailable) {
    return (
      <div className="mt-6 border-t border-slate-100 pt-5">
        <Alert variant="info" size="sm" title="Auto top-up">
          {error ?? "Auto top-up is not available yet."}
        </Alert>
      </div>
    );
  }

  return (
    <div className="mt-6 border-t border-slate-100 pt-5">
      <h3 className="text-base font-semibold text-slate-900">Auto top-up</h3>
      <p className="mt-1 text-sm text-slate-600">
        Automatically buy a package from this list when data runs out or
        expires. Uses prepaid credits.
      </p>

      {banner ? (
        <div className="mt-3">
          <Alert variant={banner.variant} size="sm">
            {banner.text}
          </Alert>
        </div>
      ) : null}

      <div className="mt-4 space-y-4">
        <label className="flex items-start gap-2 text-sm text-slate-800">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
            checked={draft.enabled}
            onChange={(event) =>
              setDraft((prev) => ({
                ...prev,
                enabled: event.target.checked,
              }))
            }
            disabled={isSaving}
          />
          <span>Enable auto top-up for a package below</span>
        </label>

        {draft.enabled ? (
          <>
            <Field>
              <Label htmlFor={`${formId}-package`}>Package</Label>
              <select
                id={`${formId}-package`}
                ref={packageSelectRef}
                className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                value={draft.packageId}
                onChange={(event) =>
                  setDraft((prev) => ({
                    ...prev,
                    packageId: event.target.value,
                  }))
                }
                disabled={isSaving}
              >
                {packageMissing ? (
                  <option value={draft.packageId}>
                    Selected package unavailable
                  </option>
                ) : null}
                {topups.map((pkg) => (
                  <option key={pkg.id} value={pkg.id}>
                    {pkg.title} · {pkg.validity_days} days
                  </option>
                ))}
              </select>
              {packageMissing ? (
                <ErrorMessage>
                  Choose a package still listed under Available top-ups.
                </ErrorMessage>
              ) : (
                <HelpText>Must be one of the packages listed above.</HelpText>
              )}
            </Field>

            <fieldset className="space-y-3">
              <legend className="text-sm font-medium text-slate-900">
                When to auto top-up
              </legend>
              <label className="flex items-start gap-2 text-sm text-slate-800">
                <input
                  ref={expiryCheckboxRef}
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                  checked={draft.expiryEnabled}
                  onChange={(event) =>
                    setDraft((prev) => ({
                      ...prev,
                      expiryEnabled: event.target.checked,
                    }))
                  }
                  disabled={isSaving}
                />
                <span>Current plan expires</span>
              </label>
              {canUseRemainingData ? (
                <div className="space-y-2">
                  <label className="flex items-start gap-2 text-sm text-slate-800">
                    <input
                      type="checkbox"
                      className="mt-0.5 h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                      checked={draft.remainingDataEnabled}
                      onChange={(event) =>
                        setDraft((prev) => ({
                          ...prev,
                          remainingDataEnabled: event.target.checked,
                        }))
                      }
                      disabled={isSaving}
                    />
                    <span>Remaining data</span>
                  </label>
                  {draft.remainingDataEnabled ? (
                    <div className="ml-6 space-y-2">
                      <label className="flex items-start gap-2 text-sm text-slate-800">
                        <input
                          type="radio"
                          name={`${formId}-usage-kind`}
                          className="mt-0.5"
                          checked={draft.usageKind === "threshold"}
                          onChange={() =>
                            setDraft((prev) => ({
                              ...prev,
                              usageKind: "threshold",
                            }))
                          }
                          disabled={isSaving}
                        />
                        <span>Below threshold</span>
                      </label>
                      {draft.usageKind === "threshold" ? (
                        <Field className="ml-6">
                          <Label htmlFor={`${formId}-threshold`}>
                            Threshold (MB)
                          </Label>
                          <Input
                            id={`${formId}-threshold`}
                            type="number"
                            min={1}
                            step={1}
                            value={draft.thresholdMb}
                            onChange={(event) =>
                              setDraft((prev) => ({
                                ...prev,
                                thresholdMb: event.target.value,
                              }))
                            }
                            disabled={isSaving}
                          />
                          <HelpText>Default is 500 MB.</HelpText>
                        </Field>
                      ) : null}
                      <label className="flex items-start gap-2 text-sm text-slate-800">
                        <input
                          type="radio"
                          name={`${formId}-usage-kind`}
                          className="mt-0.5"
                          checked={draft.usageKind === "zero"}
                          onChange={() =>
                            setDraft((prev) => ({
                              ...prev,
                              usageKind: "zero",
                            }))
                          }
                          disabled={isSaving}
                        />
                        <span>Reaches zero</span>
                      </label>
                    </div>
                  ) : null}
                </div>
              ) : (
                <Alert variant="info" size="sm">
                  This package is unlimited. Remaining-data triggers aren&apos;t
                  available.
                </Alert>
              )}
              {showOrHelper ? (
                <HelpText>
                  Auto top-up will occur when any selected condition is met.
                </HelpText>
              ) : null}
              {saveBlockedForConditions ? (
                <HelpText>Select at least one condition.</HelpText>
              ) : null}
            </fieldset>

            <fieldset className="space-y-2">
              <legend className="text-sm font-medium text-slate-900">
                Renew mode
              </legend>
              <label className="flex items-start gap-2 text-sm text-slate-800">
                <input
                  type="radio"
                  name={`${formId}-renew`}
                  className="mt-0.5"
                  checked={draft.renewMode === "until_funds"}
                  onChange={() =>
                    setDraft((prev) => ({
                      ...prev,
                      renewMode: "until_funds",
                    }))
                  }
                  disabled={isSaving}
                />
                <span>Until credits run out</span>
              </label>
              <label className="flex items-start gap-2 text-sm text-slate-800">
                <input
                  type="radio"
                  name={`${formId}-renew`}
                  className="mt-0.5"
                  checked={draft.renewMode === "fixed_count"}
                  onChange={() =>
                    setDraft((prev) => ({
                      ...prev,
                      renewMode: "fixed_count",
                    }))
                  }
                  disabled={isSaving}
                />
                <span>Renew a fixed number of times</span>
              </label>
            </fieldset>

            {draft.renewMode === "fixed_count" ? (
              <Field>
                <Label htmlFor={`${formId}-count`}>Remaining renewals</Label>
                <Input
                  id={`${formId}-count`}
                  type="number"
                  min={0}
                  step={1}
                  value={draft.remainingCount}
                  onChange={(event) =>
                    setDraft((prev) => ({
                      ...prev,
                      remainingCount: event.target.value,
                    }))
                  }
                  disabled={isSaving}
                />
              </Field>
            ) : null}

            <Field>
              <Label htmlFor={`${formId}-active-until`}>
                Policy active until
              </Label>
              <Input
                id={`${formId}-active-until`}
                type="date"
                value={draft.activeUntilDate}
                onChange={(event) =>
                  setDraft((prev) => ({
                    ...prev,
                    activeUntilDate: event.target.value,
                  }))
                }
                disabled={isSaving}
              />
              <HelpText>Leave empty for no end date.</HelpText>
            </Field>
          </>
        ) : null}

        {error ? (
          <Alert variant="error" size="sm">
            {error}
          </Alert>
        ) : null}
        {showSaved ? (
          <Alert variant="success" size="sm">
            Auto top-up saved.
          </Alert>
        ) : null}

        <Button
          type="button"
          variant="secondary"
          size="sm"
          tone="app"
          disabled={isSaving || saveBlockedForConditions}
          onClick={() => {
            void handleSave();
          }}
        >
          {isSaving ? "Saving…" : "Save auto top-up"}
        </Button>
      </div>
    </div>
  );
}
