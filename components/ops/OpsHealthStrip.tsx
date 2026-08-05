"use client";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  formatHealthLabel,
  formatRefreshedAt,
  healthStatusVariant,
  healthStripEntries,
  healthTooltip,
  shortestCacheHitTtlMs,
} from "@/lib/ops/healthDisplay";
import type { OpsHealth } from "@/lib/ops/types";

type OpsHealthStripProps = {
  health: OpsHealth;
  refreshing?: boolean;
  onRefresh?: () => void;
  error?: string | null;
};

export function OpsHealthStrip({
  health,
  refreshing = false,
  onRefresh,
  error = null,
}: OpsHealthStripProps) {
  const entries = healthStripEntries(health);
  const cacheTtlMs = shortestCacheHitTtlMs(health);
  const cacheHintSeconds =
    cacheTtlMs === null ? null : Math.max(1, Math.round(cacheTtlMs / 1000));

  return (
    <section
      className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
      aria-label="System health"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-sm font-semibold text-slate-900">Health</h2>
            <Badge
              variant={healthStatusVariant(health.overall_status)}
              title={`overall_status=${health.overall_status}`}
            >
              overall: {health.overall_status}
            </Badge>
          </div>
          <div className="mt-1 text-xs text-slate-500">
            <p>
              Last refreshed{" "}
              <span className="font-medium tabular-nums text-slate-700">
                {formatRefreshedAt(health.generated_at)}
              </span>
            </p>
            {cacheHintSeconds !== null ? (
              <p className="mt-0.5">Cached ({cacheHintSeconds} s)</p>
            ) : null}
          </div>
        </div>
        {onRefresh ? (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onRefresh}
            disabled={refreshing}
          >
            {refreshing ? "Refreshing…" : "Refresh"}
          </Button>
        ) : null}
      </div>

      {error ? (
        <p className="mt-2 text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-2">
        {entries.map(({ key, item }) => (
          <Badge
            key={key}
            variant={healthStatusVariant(item.status)}
            title={healthTooltip(item)}
          >
            {formatHealthLabel(key)}: {item.status}
            {item.reason === "disabled" ? " (disabled)" : ""}
          </Badge>
        ))}
      </div>
    </section>
  );
}
