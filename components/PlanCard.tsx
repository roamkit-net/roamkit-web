import { CatalogPriceDisplay } from "@/components/CatalogPriceDisplay";
import type { Package } from "@/lib/api";

function formatValidity(days: number): string {
  if (days === 1) {
    return "1 day";
  }
  return `${days} days`;
}

function formatData(plan: Package): string {
  return plan.is_unlimited ? "Unlimited" : plan.data_allowance;
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

function hasVoiceOrText(plan: Package): boolean {
  const { voiceMinutes, textSms } = voiceAndText(plan);
  return (voiceMinutes ?? 0) > 0 || (textSms ?? 0) > 0;
}

function formatPlanSummary(plan: Package): string {
  const { voiceMinutes, textSms } = voiceAndText(plan);
  const parts = [formatData(plan), formatValidity(plan.validity_days)];
  if ((voiceMinutes ?? 0) > 0) {
    parts.push(`${voiceMinutes} mins`);
  }
  if ((textSms ?? 0) > 0) {
    parts.push(`${textSms} SMS`);
  }
  return parts.join(" · ");
}

export function PlanCard({ plan }: { plan: Package }) {
  const countryLabel = plan.country_code || "Global";
  const showVoiceText = hasVoiceOrText(plan);

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-sky-700">
            {countryLabel}
          </p>
          <h2 className="mt-2 text-lg font-semibold text-slate-900">
            {plan.title}
          </h2>
          <p className="mt-1 text-sm text-slate-600">{plan.operator_title}</p>
        </div>
        <p className="text-xl font-bold text-slate-900">
          <CatalogPriceDisplay
            amount={plan.price_usd}
            listAmount={plan.list_price_usd}
          />
        </p>
      </div>

      {showVoiceText ? (
        <p className="mt-4 text-sm font-medium text-slate-900">
          {formatPlanSummary(plan)}
        </p>
      ) : (
        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-slate-500">Data</dt>
            <dd className="font-medium text-slate-900">{formatData(plan)}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Validity</dt>
            <dd className="font-medium text-slate-900">
              {formatValidity(plan.validity_days)}
            </dd>
          </div>
        </dl>
      )}
    </article>
  );
}
