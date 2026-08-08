import "./jsdomSetup";

import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import { createElement, useState, type ReactElement } from "react";
import {
  cleanup,
  fireEvent,
  render,
  waitFor,
  within,
} from "@testing-library/react";

import { setTokens } from "@/lib/api";
import type { Membership, Organization } from "@/types/org";

import { OrgTransferOwnershipSection } from "./OrgTransferOwnershipSection";

const originalFetch = globalThis.fetch;

const orgId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";

function makeOrg(
  overrides: {
    my_role?: Organization["my_role"];
    permissions?: Partial<Organization["permissions"]>;
  } = {},
): Organization {
  return {
    id: orgId,
    name: "Fleet",
    status: "active",
    account_id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
    my_role: overrides.my_role ?? "owner",
    permissions: {
      can_view: true,
      can_spend: true,
      can_manage_members: true,
      can_invite: true,
      can_transfer_ownership: true,
      can_archive_org: true,
      can_assign_esim: true,
      can_device_bind: true,
      ...overrides.permissions,
    },
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  };
}

const ownerMember: Membership = {
  id: "11111111-1111-1111-1111-111111111111",
  user_id: 1,
  user_email: "owner@example.com",
  role: "owner",
  status: "active",
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

const adminMember: Membership = {
  id: "22222222-2222-2222-2222-222222222222",
  user_id: 2,
  user_email: "admin@example.com",
  role: "admin",
  status: "active",
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

const revokedMember: Membership = {
  id: "33333333-3333-3333-3333-333333333333",
  user_id: 3,
  user_email: "revoked@example.com",
  role: "member",
  status: "revoked",
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

afterEach(() => {
  cleanup();
  globalThis.fetch = originalFetch;
});

beforeEach(() => {
  setTokens("test-access", "test-refresh");
});

function Harness({
  organization = makeOrg(),
  initialMembers = [ownerMember, adminMember, revokedMember],
}: {
  organization?: Organization;
  initialMembers?: Membership[];
}): ReactElement {
  const [org, setOrg] = useState(organization);
  const [members, setMembers] = useState(initialMembers);
  return createElement(
    "div",
    null,
    createElement(OrgTransferOwnershipSection, {
      organization: org,
      members,
      onTransferred: (nextOrg, nextMembers) => {
        setOrg(nextOrg);
        setMembers(nextMembers);
      },
    }),
    createElement(
      "ul",
      { "data-testid": "post-transfer-members" },
      members.map((member) =>
        createElement(
          "li",
          {
            key: member.id,
            "data-testid": `post-member-${member.user_id}`,
          },
          `${member.user_email}:${member.role}`,
        ),
      ),
    ),
    createElement(
      "p",
      { "data-testid": "post-transfer-my-role" },
      org.my_role,
    ),
  );
}

describe("OrgTransferOwnershipSection", () => {
  it("hides when caller cannot transfer ownership", () => {
    const { container } = render(
      createElement(Harness, {
        organization: makeOrg({
          my_role: "admin",
          permissions: { can_transfer_ownership: false },
        }),
      }),
    );
    assert.equal(within(container).queryByTestId("org-transfer-section"), null);
  });

  it("hides when there are no active non-owner candidates", () => {
    const { container } = render(
      createElement(Harness, {
        initialMembers: [ownerMember, revokedMember],
      }),
    );
    assert.equal(within(container).queryByTestId("org-transfer-section"), null);
  });

  it("lists only active non-owner candidates", () => {
    const { container } = render(createElement(Harness));
    const view = within(container);
    const select = view.getByTestId("org-transfer-candidate") as HTMLSelectElement;
    const values = [...select.options].map((opt) => opt.value);
    assert.deepEqual(values, ["", "2"]);
    assert.match(select.textContent ?? "", /admin@example.com/);
    assert.equal(select.textContent?.includes("revoked@example.com"), false);
    assert.equal(select.textContent?.includes("owner@example.com"), false);
  });

  it("after success refreshes org+members from GET and hides transfer UI", async () => {
    let transferPosts = 0;
    let orgGets = 0;
    let memberGets = 0;

    globalThis.fetch = async (input, init) => {
      const path = String(input);
      const method = String(init?.method ?? "GET");

      if (path.includes("/transfer-ownership/") && method === "POST") {
        transferPosts += 1;
        // Deliberately stale roles in POST body — UI must not trust these alone.
        return new Response(
          JSON.stringify({
            organization: makeOrg({
              my_role: "owner",
              permissions: { can_transfer_ownership: true },
            }),
            new_owner_membership: { ...adminMember, role: "member" },
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      if (path.endsWith(`/orgs/${orgId}/`) && method === "GET") {
        orgGets += 1;
        return new Response(
          JSON.stringify(
            makeOrg({
              my_role: "admin",
              permissions: {
                can_transfer_ownership: false,
                can_manage_members: true,
                can_invite: true,
              },
            }),
          ),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      if (path.endsWith(`/orgs/${orgId}/members/`) && method === "GET") {
        memberGets += 1;
        return new Response(
          JSON.stringify([
            { ...ownerMember, role: "admin" },
            { ...adminMember, role: "owner" },
            revokedMember,
          ]),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      return new Response(JSON.stringify({ detail: `unexpected ${method} ${path}` }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    };

    const { container } = render(createElement(Harness));
    const view = within(container);

    fireEvent.change(view.getByTestId("org-transfer-candidate"), {
      target: { value: "2" },
    });
    fireEvent.click(view.getByTestId("org-transfer-confirm"));
    fireEvent.click(view.getByTestId("org-transfer-submit"));

    await waitFor(() => {
      assert.equal(transferPosts, 1);
      assert.equal(orgGets, 1);
      assert.equal(memberGets, 1);
      // Former owner lost can_transfer_ownership → section unmounts.
      assert.equal(view.queryByTestId("org-transfer-section"), null);
      assert.equal(view.getByTestId("post-transfer-my-role").textContent, "admin");
      assert.equal(
        view.getByTestId("post-member-1").textContent,
        "owner@example.com:admin",
      );
      assert.equal(
        view.getByTestId("post-member-2").textContent,
        "admin@example.com:owner",
      );
    });
  });

  it("shows API error without refreshing on failure", async () => {
    let orgGets = 0;
    globalThis.fetch = async (input, init) => {
      if (String(init?.method) === "POST") {
        return new Response(
          JSON.stringify({ detail: "Permission denied." }),
          {
            status: 403,
            statusText: "Forbidden",
            headers: { "Content-Type": "application/json" },
          },
        );
      }
      if (String(input).includes("/orgs/") && !init?.method) {
        orgGets += 1;
      }
      return new Response("{}", { status: 200 });
    };

    const { container } = render(createElement(Harness));
    const view = within(container);
    fireEvent.change(view.getByTestId("org-transfer-candidate"), {
      target: { value: "2" },
    });
    fireEvent.click(view.getByTestId("org-transfer-confirm"));
    fireEvent.click(view.getByTestId("org-transfer-submit"));

    await waitFor(() => {
      assert.match(
        view.getByTestId("org-transfer-error").textContent ?? "",
        /Permission denied/,
      );
    });
    assert.equal(orgGets, 0);
    assert.ok(view.getByTestId("org-transfer-section"));
  });
});
