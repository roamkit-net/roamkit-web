export const PARTNER_CHANNEL_STORAGE_KEY = "roamkit.partner.channelId";

export type PartnerKind = "individual" | "team";
export type PartnerRole = "owner" | "admin" | "viewer";

export type PartnerContextItem = {
  channel_id: string;
  kind: PartnerKind;
  label: string;
  effective_role: PartnerRole;
  is_active: boolean;
  capabilities: {
    can_grant: boolean;
    can_manage_invite: boolean;
  };
};

export type PartnerSelection =
  | { status: "unavailable" }
  | { status: "choose" }
  | { status: "ready"; context: PartnerContextItem; announced: boolean };

export function choosePartnerContext(
  contexts: PartnerContextItem[],
  storedChannelId: string | null,
): PartnerSelection {
  if (contexts.length === 0) {
    return { status: "unavailable" };
  }
  if (contexts.length === 1) {
    return { status: "ready", context: contexts[0], announced: false };
  }
  const stored = contexts.find((item) => item.channel_id === storedChannelId);
  if (stored) {
    return { status: "ready", context: stored, announced: false };
  }
  return { status: "choose" };
}

export function recoverPartnerContext(
  contexts: PartnerContextItem[],
  deniedChannelId: string,
): PartnerSelection {
  const remaining = contexts.filter((item) => item.channel_id !== deniedChannelId);
  if (remaining.length === 1) {
    return { status: "ready", context: remaining[0], announced: true };
  }
  if (remaining.length > 1) {
    return { status: "choose" };
  }
  return { status: "unavailable" };
}

export function partnerContextLabel(item: PartnerContextItem): string {
  const kind = item.kind === "individual" ? "Individual" : "Team";
  const paused = item.is_active ? "" : " · paused";
  return `${item.label} — ${kind} · ${item.effective_role}${paused}`;
}

export function rowsForChannel<T>(
  channelId: string,
  loadedChannelId: string | null,
  rows: T | null,
): T | null {
  return loadedChannelId === channelId ? rows : null;
}

export function readStoredPartnerChannelId(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  return window.localStorage.getItem(PARTNER_CHANNEL_STORAGE_KEY);
}

export function writeStoredPartnerChannelId(channelId: string): void {
  window.localStorage.setItem(PARTNER_CHANNEL_STORAGE_KEY, channelId);
}

export function clearStoredPartnerChannelId(): void {
  window.localStorage.removeItem(PARTNER_CHANNEL_STORAGE_KEY);
}
