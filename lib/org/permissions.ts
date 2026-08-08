import type { Organization, OrgPermissions } from "@/types/org";

/** Client UX gate only — API remains the security enforcement point. */
export function canInvite(
  org: Pick<Organization, "permissions"> | null | undefined,
): boolean {
  return Boolean(org?.permissions?.can_invite);
}

export function canManageMembers(
  org: Pick<Organization, "permissions"> | null | undefined,
): boolean {
  return Boolean(org?.permissions?.can_manage_members);
}

export function hasPermission(
  permissions: OrgPermissions | null | undefined,
  key: keyof OrgPermissions,
): boolean {
  return Boolean(permissions?.[key]);
}
