import { CatalogPriceDisplay } from "@/components/CatalogPriceDisplay";
import type { Package } from "@/lib/api";

function formatValidity(days: number): string {
  if (days === 1) {
    return "1 day";
  }
  return `${days} days`;
}

function parseAllowanceFromTitle(
  title: string,
): { voiceMinutes: number | null; textSms: number | null } {
  const voiceMatch = title.match(/(\d+)\s*mins?\b/i);
  const textMatch = title.match(/(\d+)\s*sms\b/i);
  return {
    voiceMinutes: voiceMatch ? Number.parseInt(voiceMatch[1], 10) : null,
    textSms: textMatch ? Number.parseInt(textMatch[1], 10) : null,
  };
}

function voiceAndText(plan: Package): {
  voiceMinutes: number | null;
  textSms: number | null;
} {
  const fromFields = {
    voiceMinutes: plan.voice_minutes,
    textSms: plan.text_sms,
  };
  if ((fromFields.voiceMinutes ?? 0) > 0 || (fromFields.textSms ?? 0) > 0) {
    return fromFields;
  }
  return parseAllowanceFromTitle(plan.title);
}

function formatLeftLabel(plan: Package, showValidity: boolean): string {
  const dataLabel = plan.is_unlimited ? "Unlimited GB" : plan.data_allowance;
  const parts = [dataLabel];

  if (showValidity) {
    parts.push(formatValidity(plan.validity_days));
  }

  const { voiceMinutes, textSms } = voiceAndText(plan);
  if ((voiceMinutes ?? 0) > 0) {
    parts.push(`${voiceMinutes} mins`);
  }
  if ((textSms ?? 0) > 0) {
    parts.push(`${textSms} SMS`);
  }

  return parts.join(" · ");
}

export function PackageRow({
  plan,
  showValidity = false,
  onBuy,
  isBuying = false,
  buyDisabled = false,
  buyTitle,
}: {
  plan: Package;
  showValidity?: boolean;
  onBuy?: (plan: Package, buyButton: HTMLButtonElement) => void;
  isBuying?: boolean;
  buyDisabled?: boolean;
  buyTitle?: string;
}) {
  return (
    <article className="flex w-full items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
      <p className="min-w-0 text-base font-medium text-slate-900">
        {formatLeftLabel(plan, showValidity)}
      </p>
      <div className="flex shrink-0 items-center gap-3">
        <p className="text-base font-bold text-slate-900">
          <CatalogPriceDisplay amount={plan.price_usd} />
        </p>
        {onBuy ? (
          <button
            type="button"
            onClick={(event) => onBuy(plan, event.currentTarget)}
            disabled={isBuying || buyDisabled}
            title={buyTitle}
            aria-label={buyTitle}
            className="inline-flex min-h-11 items-center rounded-lg bg-sky-700 px-3 py-1.5 text-sm font-semibold text-white hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isBuying ? "Buying…" : "Buy"}
          </button>
        ) : null}
      </div>
    </article>
  );
}
