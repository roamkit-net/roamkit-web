import { Alert } from "@/components/ui/Alert";
import { buttonClassName } from "@/components/ui/Button";
import type { PartnerCustomerPlan, PartnerCustomerPlans } from "@/lib/partner/client";
import {
  planDataAllowance,
  planDestination,
  planExpiry,
  planUpdatedAt,
  planUsage,
  planValidity,
} from "@/lib/partner/customerPlans";

const PLAN_COLUMNS = ["Destination", "Data", "Validity", "Usage", "Expires", "Updated"] as const;

export function customerPlansPanelId(customerId: number): string {
  return `customer-plans-${customerId}`;
}

export function CustomerPlansToggle({
  canView,
  label,
  expanded,
  controlsId,
  onClick,
}: {
  canView: boolean;
  label: string;
  expanded: boolean;
  controlsId: string;
  onClick: () => void;
}) {
  if (!canView) {
    return null;
  }
  return (
    <button
      type="button"
      aria-expanded={expanded}
      aria-controls={controlsId}
      onClick={onClick}
      className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded text-slate-500 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
    >
      <span className="sr-only">
        {expanded ? "Hide" : "Show"} plans for {label}
      </span>
      <span aria-hidden="true">{expanded ? "▾" : "▸"}</span>
    </button>
  );
}

function PlanTable({
  label,
  plans,
  keyPrefix,
}: {
  label: "Active plans" | "Expired plans";
  plans: PartnerCustomerPlan[];
  keyPrefix: "active" | "expired";
}) {
  return (
    <div className="mt-1 w-0 min-w-full overflow-x-auto rounded-lg border border-slate-200 bg-white">
      <table aria-label={label} className="min-w-max w-full text-left text-sm">
        <thead className="text-xs text-slate-500">
          <tr>
            {PLAN_COLUMNS.map((column) => (
              <th key={column} scope="col" className="px-3 py-2 font-medium">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {plans.map((plan, index) => (
            <tr key={`${keyPrefix}-${index}`} className="border-t border-slate-100">
              <td className="px-3 py-2 font-medium text-slate-900">{planDestination(plan)}</td>
              <td className="whitespace-nowrap px-3 py-2 text-slate-700">{planDataAllowance(plan)}</td>
              <td className="tabular-nums px-3 py-2 text-slate-700">{planValidity(plan)}</td>
              <td className="tabular-nums whitespace-nowrap px-3 py-2 text-slate-700">{planUsage(plan)}</td>
              <td className="tabular-nums whitespace-nowrap px-3 py-2 text-slate-700">{planExpiry(plan)}</td>
              <td className="tabular-nums whitespace-nowrap px-3 py-2 text-slate-700">{planUpdatedAt(plan)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PlanGroup({
  title,
  label,
  plans,
  keyPrefix,
}: {
  title: string;
  label: "Active plans" | "Expired plans";
  plans: PartnerCustomerPlan[];
  keyPrefix: "active" | "expired";
}) {
  return (
    <section className="mt-3 first:mt-0">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</h2>
      {plans.length === 0 ? (
        <p className="mt-1 text-sm text-slate-500">None</p>
      ) : (
        <PlanTable label={label} plans={plans} keyPrefix={keyPrefix} />
      )}
    </section>
  );
}

export function CustomerPlansPanel({
  id,
  state,
  onRetry,
}: {
  id: string;
  state: { status: "loading" } | { status: "error"; message: string } | { status: "loaded"; data: PartnerCustomerPlans };
  onRetry: () => void;
}) {
  return (
    <div id={id}>
      {state.status === "loading" ? <p className="text-sm text-slate-500">Loading plans…</p> : null}
      {state.status === "error" ? (
        <Alert variant="error" size="sm">
          <span>{state.message}</span>
          <button
            type="button"
            className={`${buttonClassName({ variant: "secondary", size: "sm" })} ml-3`}
            onClick={onRetry}
          >
            Retry
          </button>
        </Alert>
      ) : null}
      {state.status === "loaded" && state.data.active.length === 0 && state.data.expired.length === 0 ? (
        <p className="text-sm text-slate-600">No active or expired plans available.</p>
      ) : null}
      {state.status === "loaded" && (state.data.active.length > 0 || state.data.expired.length > 0) ? (
        <>
          <PlanGroup title="Active" label="Active plans" plans={state.data.active} keyPrefix="active" />
          {state.data.expired.length > 0 ? (
            <PlanGroup title="Expired" label="Expired plans" plans={state.data.expired} keyPrefix="expired" />
          ) : null}
        </>
      ) : null}
    </div>
  );
}
