"use client";

import { useState } from "react";

import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ListRow } from "@/components/ui/ListRow";
import { ApiError } from "@/lib/api";
import {
  listOrganizationMembers,
  revokeOrganizationMember,
  updateOrganizationMemberRole,
} from "@/lib/org/client";
import type { InviteRole, Membership } from "@/types/org";

const MANAGED_ROLES: { value: InviteRole; label: string }[] = [
  { value: "admin", label: "Admin" },
  { value: "member", label: "Member" },
  { value: "viewer", label: "Viewer" },
];

type OrgMembersSectionProps = {
  organizationId: string;
  members: Membership[];
  canManageMembers: boolean;
  onMembersChange: (members: Membership[]) => void;
};

function isOwner(member: Membership): boolean {
  return member.role === "owner";
}

function isActive(member: Membership): boolean {
  return member.status === "active";
}

/**
 * Member list with optional manage controls.
 * After role/revoke mutations, always re-fetches the member list from the API
 * (no optimistic local row edits).
 */
export function OrgMembersSection({
  organizationId,
  members,
  canManageMembers,
  onMembersChange,
}: OrgMembersSectionProps) {
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function refreshMembers() {
    const fresh = await listOrganizationMembers(organizationId);
    onMembersChange(fresh);
  }

  async function handleRoleChange(membershipId: string, role: InviteRole) {
    setPendingId(membershipId);
    setError(null);
    try {
      await updateOrganizationMemberRole(organizationId, membershipId, role);
      await refreshMembers();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Unable to update member role right now.",
      );
    } finally {
      setPendingId(null);
    }
  }

  async function handleRevoke(membershipId: string) {
    setPendingId(membershipId);
    setError(null);
    try {
      await revokeOrganizationMember(organizationId, membershipId);
      await refreshMembers();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Unable to revoke membership right now.",
      );
    } finally {
      setPendingId(null);
    }
  }

  return (
    <section data-testid="org-members-section" className="grid gap-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Members</h2>
        <p className="mt-1 text-sm text-slate-600">
          Active and historical membership rows for this organization.
        </p>
      </div>

      {error ? (
        <Alert variant="warning" title={error} data-testid="org-members-error" />
      ) : null}

      <ul className="grid gap-3" data-testid="org-members-list">
        {members.map((member) => {
          const manage =
            canManageMembers && isActive(member) && !isOwner(member);
          const busy = pendingId === member.id;

          return (
            <ListRow
              key={member.id}
              as="li"
              data-testid={`org-member-row-${member.id}`}
              trailing={
                manage ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900"
                      value={
                        MANAGED_ROLES.some((r) => r.value === member.role)
                          ? member.role
                          : "member"
                      }
                      disabled={busy}
                      aria-label={`Role for ${member.user_email}`}
                      data-testid={`org-member-role-${member.id}`}
                      onChange={(event) => {
                        void handleRoleChange(
                          member.id,
                          event.target.value as InviteRole,
                        );
                      }}
                    >
                      {MANAGED_ROLES.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <Badge
                      variant={
                        member.status === "active" ? "success" : "neutral"
                      }
                    >
                      {member.status}
                    </Badge>
                    <Button
                      type="button"
                      size="sm"
                      variant="danger"
                      disabled={busy}
                      onClick={() => void handleRevoke(member.id)}
                      data-testid={`org-member-revoke-${member.id}`}
                    >
                      {busy ? "Working…" : "Revoke"}
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="primary">{member.role}</Badge>
                    <Badge
                      variant={
                        member.status === "active" ? "success" : "neutral"
                      }
                    >
                      {member.status}
                    </Badge>
                  </div>
                )
              }
            >
              <p className="truncate font-medium text-slate-900">
                {member.user_email}
              </p>
            </ListRow>
          );
        })}
      </ul>
    </section>
  );
}
