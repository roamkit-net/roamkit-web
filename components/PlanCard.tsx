import type { Package } from "@/lib/api";

function formatPrice(priceUsd: string): string {
  const amount = Number.parseFloat(priceUsd);
  if (Number.isNaN(amount)) {
    return priceUsd;
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

function formatValidity(days: number): string {
  if (days === 1) {
    return "1 day";
  }
  return `${days} days`;
}

export function PlanCard({ plan }: { plan: Package }) {
  const countryLabel = plan.country_code || "Global";

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
          {formatPrice(plan.price_usd)}
        </p>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-slate-500">Data</dt>
          <dd className="font-medium text-slate-900">
            {plan.is_unlimited ? "Unlimited" : plan.data_allowance}
          </dd>
        </div>
        <div>
          <dt className="text-slate-500">Validity</dt>
          <dd className="font-medium text-slate-900">
            {formatValidity(plan.validity_days)}
          </dd>
        </div>
      </dl>
    </article>
  );
}
