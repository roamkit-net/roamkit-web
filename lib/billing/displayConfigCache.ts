/**
 * localStorage cache for public billing/config display payload.
 * Invalidates when API config_version (or local cache_schema) changes.
 */

import type { BillingConfigResponse } from "@/types/billing";

export const DISPLAY_CONFIG_CACHE_KEY = "roamkit_billing_display_config";
/** Bump when the envelope shape changes (not when API config_version changes). */
export const DISPLAY_CONFIG_CACHE_SCHEMA = 1;

export type DisplayConfigCacheEnvelope = {
  cache_schema: number;
  saved_at: number;
  config: BillingConfigResponse;
};

function canUseLocalStorage(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function isBillingConfigResponse(value: unknown): value is BillingConfigResponse {
  if (!value || typeof value !== "object") {
    return false;
  }
  const record = value as Record<string, unknown>;
  return (
    typeof record.config_version === "number" &&
    Number.isFinite(record.config_version) &&
    typeof record.token_symbol === "string" &&
    typeof record.token_name === "string" &&
    typeof record.token_decimals === "number" &&
    typeof record.display_decimals === "number" &&
    typeof record.billing_enabled === "boolean"
  );
}

export function parseDisplayConfigCache(
  raw: string | null,
): DisplayConfigCacheEnvelope | null {
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as Partial<DisplayConfigCacheEnvelope>;
    if (parsed.cache_schema !== DISPLAY_CONFIG_CACHE_SCHEMA) {
      return null;
    }
    if (typeof parsed.saved_at !== "number" || !Number.isFinite(parsed.saved_at)) {
      return null;
    }
    if (!isBillingConfigResponse(parsed.config)) {
      return null;
    }
    return {
      cache_schema: DISPLAY_CONFIG_CACHE_SCHEMA,
      saved_at: parsed.saved_at,
      config: parsed.config,
    };
  } catch {
    return null;
  }
}

export function readDisplayConfigCache(): DisplayConfigCacheEnvelope | null {
  if (!canUseLocalStorage()) {
    return null;
  }
  try {
    return parseDisplayConfigCache(
      localStorage.getItem(DISPLAY_CONFIG_CACHE_KEY),
    );
  } catch {
    return null;
  }
}

/**
 * Persist config. Replaces cache when config_version differs or on first write.
 */
export function writeDisplayConfigCache(
  config: BillingConfigResponse,
  savedAt: number = Date.now(),
): void {
  if (!canUseLocalStorage()) {
    return;
  }
  const previous = readDisplayConfigCache();
  if (
    previous &&
    previous.config.config_version === config.config_version &&
    previous.config.token_symbol === config.token_symbol &&
    previous.config.display_decimals === config.display_decimals &&
    previous.config.billing_enabled === config.billing_enabled &&
    previous.config.token_decimals === config.token_decimals &&
    previous.config.token_name === config.token_name
  ) {
    return;
  }
  const envelope: DisplayConfigCacheEnvelope = {
    cache_schema: DISPLAY_CONFIG_CACHE_SCHEMA,
    saved_at: savedAt,
    config,
  };
  try {
    localStorage.setItem(DISPLAY_CONFIG_CACHE_KEY, JSON.stringify(envelope));
  } catch {
    // ignore quota / private mode
  }
}

export function clearDisplayConfigCache(): void {
  if (!canUseLocalStorage()) {
    return;
  }
  try {
    localStorage.removeItem(DISPLAY_CONFIG_CACHE_KEY);
  } catch {
    // ignore
  }
}
