import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { canInvite, hasPermission } from "@/lib/org/permissions";
import type { Organization, OrgPermissions } from "@/types/org";

function perms(overrides: Partial<OrgPermissions> = {}): OrgPermissions {
  return {
    can_view: true,
    can_spend: false,
    can_manage_members: false,
    can_invite: false,
    can_transfer_ownership: false,
    can_archive_org: false,
    can_assign_esim: false,
    can_device_bind: false,
    ...overrides,
  };
}

function org(permissions: OrgPermissions): Organization {
  return {
    id: "11111111-1111-1111-1111-111111111111",
    name: "Fleet",
    status: "active",
    account_id: "22222222-2222-2222-2222-222222222222",
    my_role: "member",
    permissions,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  };
}

describe("org permissions UX gates", () => {
  it("canInvite is true only when permissions.can_invite", () => {
    assert.equal(canInvite(org(perms({ can_invite: true }))), true);
    assert.equal(canInvite(org(perms({ can_invite: false }))), false);
    assert.equal(canInvite(null), false);
  });

  it("hasPermission reads a single flag", () => {
    const permissions = perms({ can_view: true, can_spend: false });
    assert.equal(hasPermission(permissions, "can_view"), true);
    assert.equal(hasPermission(permissions, "can_spend"), false);
  });
});
