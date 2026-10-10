import { formatEsimDateTime, formatEsimStatus } from "@/lib/esim/display";

import type { PartnerCustomerPlan } from "./client";

export type CustomerColumnFlags = {
  showBalance: boolean;
  showEarned: boolean;
  showAccruals: boolean;
  canGrant: boolean;
};

export function plansCacheKey(channelId: string, customerId: number): string {
  return `${channelId}:${customerId}`;
}

export function plansResponseIsCurrent(
  requestedChannelId: string,
  currentChannelId: string,
): boolean {
  return requestedChannelId === currentChannelId;
}

export function customerColumnCount(flags: CustomerColumnFlags): number {
  return (
    2 +
    Number(flags.showBalance) +
    Number(flags.showEarned) +
    Number(flags.showAccruals) +
    Number(flags.canGrant)
  );
}

export function planDestination(plan: PartnerCustomerPlan): string {
  const location = plan.location_title.trim();
  if (location) {
    return location;
  }
  const title = plan.package_title.trim();
  if (title) {
    return title;
  }
  return "—";
}

export function planDataAllowance(plan: PartnerCustomerPlan): string {
  return plan.data_allowance.trim() ? plan.data_allowance : "—";
}

export function planValidity(plan: PartnerCustomerPlan): string {
  if (plan.validity_days == null) {
    return "—";
  }
  return plan.validity_days === 1 ? "1 day" : `${plan.validity_days} days`;
}

export function planStatus(plan: PartnerCustomerPlan): string {
  return formatEsimStatus(plan.status);
}

export function planUsage(plan: PartnerCustomerPlan): string {
  if (plan.usage_is_unlimited === true) {
    return "Unlimited";
  }
  if (plan.usage_is_unlimited === null) {
    return "Usage not synced";
  }
  if (plan.usage_remaining_mb == null || plan.usage_total_mb == null) {
    return "—";
  }
  return `${plan.usage_remaining_mb} / ${plan.usage_total_mb} MB`;
}

export function planExpiry(plan: PartnerCustomerPlan): string {
  if (!plan.usage_expired_at) {
    return "—";
  }
  return formatEsimDateTime(plan.usage_expired_at);
}

export function planUpdatedAt(plan: PartnerCustomerPlan): string {
  return formatEsimDateTime(plan.usage_synced_at);
}
