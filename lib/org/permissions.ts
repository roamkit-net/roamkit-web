import type { Membership, Organization, OrgPermissions } from "@/types/org";

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

export function canTransferOwnership(
  org: Pick<Organization, "permissions"> | null | undefined,
): boolean {
  return Boolean(org?.permissions?.can_transfer_ownership);
}

/** Active members who are not the current owner — transfer candidates. */
export function transferOwnershipCandidates(
  members: Membership[],
): Membership[] {
  return members.filter(
    (member) => member.status === "active" && member.role !== "owner",
  );
}

export function hasPermission(
  permissions: OrgPermissions | null | undefined,
  key: keyof OrgPermissions,
): boolean {
  return Boolean(permissions?.[key]);
}
