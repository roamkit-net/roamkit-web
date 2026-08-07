/** Auto top-up policy types (me API). */

export type AutoTopupTriggerMode =
  | "usage_zero"
  | "usage_threshold"
  | "expiry";

export type AutoTopupRenewMode = "until_funds" | "fixed_count";

export type AutoTopupStatus =
  | "active"
  | "paused"
  | "blocked"
  | "disabled";

export type AutoTopupPolicy = {
  id: string;
  package_id: string;
  enabled: boolean;
  status: AutoTopupStatus;
  reason: string;
  trigger_mode: AutoTopupTriggerMode;
  threshold_mb: number | null;
  renew_mode: AutoTopupRenewMode;
  remaining_count: number | null;
  cooldown_until: string | null;
  last_triggered_at: string | null;
  version: number;
  created_at: string;
  updated_at: string;
};

export type AutoTopupPolicyWrite = {
  package_id: string;
  enabled: boolean;
  trigger_mode: AutoTopupTriggerMode;
  threshold_mb?: number | null;
  renew_mode: AutoTopupRenewMode;
  remaining_count?: number | null;
  version?: number | null;
};
