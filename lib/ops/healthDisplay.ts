import type { BadgeVariant } from "@/components/ui/Badge";
import type { OpsHealth, OpsHealthItem } from "@/lib/ops/types";

/** Map API status → Badge variant. No reinterpretation of reason beyond disabled→healthy. */
export function healthStatusVariant(status: string): BadgeVariant {
  switch (status) {
    case "healthy":
      return "success";
    case "degraded":
      return "warning";
    case "unhealthy":
      return "danger";
    case "unknown":
    default:
      return "neutral";
  }
}

export function formatHealthLabel(key: string): string {
  return key.replace(/_/g, " ");
}

/** Native tooltip text — message only; do not parse for branching. */
export function healthTooltip(item: OpsHealthItem): string {
  const parts = [item.message];
  if (item.reason && item.reason !== "ok") {
    parts.push(`reason=${item.reason}`);
  }
  if (item.source) {
    parts.push(`source=${item.source}`);
  }
  return parts.join(" · ");
}

/**
 * Shortest remaining probe-cache TTL from API `cache` metadata.
 * Returns null when no check reports a cache hit with ttl — UI must not invent TTL.
 */
export function shortestCacheHitTtlMs(health: OpsHealth): number | null {
  let min: number | null = null;
  const bags = [
    health.dependencies,
    health.workers,
    health.providers,
    health.checks,
  ];
  for (const bag of bags) {
    if (!bag) continue;
    for (const item of Object.values(bag)) {
      const cache = item.cache;
      if (!cache?.hit) continue;
      const ttl = cache.ttl_remaining_ms;
      if (typeof ttl !== "number" || ttl < 0) continue;
      if (min === null || ttl < min) min = ttl;
    }
  }
  return min;
}

export function formatRefreshedAt(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

export type HealthStripEntry = { key: string; item: OpsHealthItem };

/** Flatten deps/workers/providers for the strip (stable order). */
export function healthStripEntries(health: OpsHealth): HealthStripEntry[] {
  const entries: HealthStripEntry[] = [];
  for (const [key, item] of Object.entries(health.dependencies ?? {})) {
    entries.push({ key, item });
  }
  for (const [key, item] of Object.entries(health.workers ?? {})) {
    entries.push({ key, item });
  }
  for (const [key, item] of Object.entries(health.providers ?? {})) {
    entries.push({ key, item });
  }
  return entries;
}
