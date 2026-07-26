/**
 * Best-effort eSIM install telemetry. Never throws to callers.
 * Safe against pre–Wave 1 APIs (missing /events/ → silent no-op).
 */

import { ApiError, postMyEsimEvent } from "@/lib/api";

export type EsimTelemetryEvent =
  | "install.opened"
  | "install.qr_rendered"
  | "install.qr_zoomed"
  | "install.apple_install_clicked"
  | "install.manual_install_clicked"
  | "install.completed"
  | "install.roaming_checklist_viewed"
  | "install.setup_confirmed"
  | "install.setup_skipped";

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function createSetupSessionId(): string {
  return newId();
}

export type EsimTelemetry = {
  track(
    event: EsimTelemetryEvent,
    opts?: {
      resumeStep?: number;
      payload?: Record<string, unknown>;
      idempotencyKey?: string;
    },
  ): void;
};

/** Once /events/ is known missing on this origin, skip further POSTs. */
let eventsEndpointUnavailable = false;

export function createEsimTelemetry(
  esimId: number | string,
  setupSessionId: string,
): EsimTelemetry {
  return {
    track(event, opts) {
      if (eventsEndpointUnavailable) {
        return;
      }
      const idempotencyKey =
        opts?.idempotencyKey ??
        `${setupSessionId}:${event}:${opts?.resumeStep ?? ""}`;
      void postMyEsimEvent(esimId, {
        event_type: event,
        idempotency_key: idempotencyKey,
        setup_session_id: setupSessionId,
        schema_version: 1,
        payload: opts?.payload ?? {},
        resume_step: opts?.resumeStep,
      }).catch((err: unknown) => {
        if (err instanceof ApiError && (err.status === 404 || err.status === 405)) {
          eventsEndpointUnavailable = true;
        }
        // best-effort against older backends
      });
    },
  };
}

/** Reset circuit for tests. */
export function resetEsimTelemetryCircuit(): void {
  eventsEndpointUnavailable = false;
}

export function needsSetup(esim: {
  setup_completed_at?: string | null;
  setup_skipped_at?: string | null;
  status: string;
}): boolean {
  if (esim.setup_completed_at || esim.setup_skipped_at) {
    return false;
  }
  const done = new Set([
    "activated",
    "active", // pre–Wave 1 synonym
    "in_use",
    "exhausted",
    "expired",
  ]);
  return !done.has(esim.status);
}

export function activationPolicyMessage(policy?: string | null): string {
  if (policy === "installation") {
    return "Your package starts immediately after installation.";
  }
  if (policy === "first_usage") {
    return "Your package starts only when activated (first use).";
  }
  return "Check when this package starts counting — policy unknown.";
}
