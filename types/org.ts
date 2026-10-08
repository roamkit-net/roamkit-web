/** Organization + invite types (ADR 020 / API PR3–PR5). */

export type OrgPermissions = {
  can_view: boolean;
  can_spend: boolean;
  can_manage_members: boolean;
  can_invite: boolean;
  can_transfer_ownership: boolean;
  can_archive_org: boolean;
  can_assign_esim: boolean;
  can_device_bind: boolean;
};

export type OrganizationStatus = "active" | "suspended" | "archived";

export type MembershipRole = "owner" | "admin" | "member" | "viewer";

export type MembershipStatus = "active" | "suspended" | "revoked";

/** Roles that may be granted via invite (owner is never inviteable). */
export type InviteRole = "admin" | "member" | "viewer";

export type InviteStatus = "pending" | "accepted" | "revoked" | "expired";

export type Organization = {
  id: string;
  name: string;
  status: OrganizationStatus;
  account_id: string;
  my_role: MembershipRole | string;
  permissions: OrgPermissions;
  created_at: string;
  updated_at: string;
};

export type Membership = {
  id: string;
  user_id: number;
  user_email: string;
  role: MembershipRole | string;
  status: MembershipStatus | string;
  created_at: string;
  updated_at: string;
};

export type OrganizationInvite = {
  id: string;
  organization_id: string;
  email: string;
  email_normalized: string;
  display_name: string;
  role: InviteRole | string;
  status: InviteStatus | string;
  expires_at: string;
  invited_by_email: string;
  accepted_at: string | null;
  revoked_at: string | null;
  created_at: string;
  updated_at: string;
};

export type OrganizationInviteCreatePayload = {
  email: string;
  role?: InviteRole;
};

export type OrganizationInviteCreateResponse = {
  invite: OrganizationInvite;
  /** Plaintext single-use token — only present on create/refresh responses. */
  token: string;
  created: boolean;
};

export type OrganizationInviteAcceptResponse = {
  membership: Membership;
  organization_id: string;
  already_accepted: boolean;
};

export type OrganizationTransferOwnershipResponse = {
  organization: Organization;
  new_owner_membership: Membership;
};
