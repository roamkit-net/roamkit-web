import { CatalogPriceDisplay } from "@/components/CatalogPriceDisplay";
import { Button } from "@/components/ui/Button";
import { ListRow } from "@/components/ui/ListRow";
import type { Package } from "@/lib/api";

function formatValidity(days: number): string {
  if (days === 1) {
    return "1 day";
  }
  return `${days} days`;
}

function parseAllowanceFromTitle(title: string): {
  voiceMinutes: number | null;
  textSms: number | null;
} {
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
    <ListRow
      as="article"
      trailing={
        <>
          <p className="text-base font-bold text-slate-900">
            <CatalogPriceDisplay amount={plan.price_usd} />
          </p>
          {onBuy ? (
            <Button
              type="button"
              size="sm"
              variant="primary"
              onClick={(event) => onBuy(plan, event.currentTarget)}
              disabled={isBuying || buyDisabled}
              title={buyTitle}
              aria-label={buyTitle}
              className="min-h-11"
            >
              {isBuying ? "Buying…" : "Buy"}
            </Button>
          ) : null}
        </>
      }
    >
      <p className="text-base font-medium text-slate-900">
        {formatLeftLabel(plan, showValidity)}
      </p>
    </ListRow>
  );
}
