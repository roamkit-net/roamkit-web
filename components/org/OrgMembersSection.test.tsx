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
import type { Membership } from "@/types/org";

import { OrgMembersSection } from "./OrgMembersSection";

const originalFetch = globalThis.fetch;

const owner: Membership = {
  id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
  user_id: 1,
  user_email: "owner@example.com",
  role: "owner",
  status: "active",
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

const member: Membership = {
  id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
  user_id: 2,
  user_email: "member@example.com",
  role: "member",
  status: "active",
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

const orgId = "cccccccc-cccc-cccc-cccc-cccccccccccc";

afterEach(() => {
  cleanup();
  globalThis.fetch = originalFetch;
});

beforeEach(() => {
  setTokens("test-access", "test-refresh");
});

function Harness({
  canManageMembers = true,
  initial = [owner, member],
}: {
  canManageMembers?: boolean;
  initial?: Membership[];
}): ReactElement {
  const [members, setMembers] = useState(initial);
  return createElement(OrgMembersSection, {
    organizationId: orgId,
    members,
    canManageMembers,
    onMembersChange: setMembers,
  });
}

describe("OrgMembersSection", () => {
  it("hides manage controls when canManageMembers is false", () => {
    const { container } = render(
      createElement(Harness, { canManageMembers: false }),
    );
    const view = within(container);
    assert.equal(view.queryByTestId(`org-member-role-${member.id}`), null);
    assert.equal(view.queryByTestId(`org-member-revoke-${member.id}`), null);
  });

  it("keeps owner row read-only even when canManageMembers", () => {
    const { container } = render(createElement(Harness));
    const view = within(container);
    assert.equal(view.queryByTestId(`org-member-role-${owner.id}`), null);
    assert.equal(view.queryByTestId(`org-member-revoke-${owner.id}`), null);
    assert.match(
      view.getByTestId(`org-member-row-${owner.id}`).textContent ?? "",
      /owner/,
    );
  });

  it("re-renders role from fresh list fetch after PATCH, not optimistic local state", async () => {
    let listCalls = 0;
    globalThis.fetch = async (input, init) => {
      const path = String(input);
      const method = String(init?.method ?? "GET");

      if (path.includes(`/members/${member.id}/`) && method === "PATCH") {
        // Deliberately return a different role than the subsequent list.
        return new Response(
          JSON.stringify({ ...member, role: "admin", status: "active" }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      if (path.endsWith(`/orgs/${orgId}/members/`) && method === "GET") {
        listCalls += 1;
        return new Response(
          JSON.stringify([
            owner,
            {
              ...member,
              role: "viewer",
              status: "active",
              updated_at: "2026-01-02T00:00:00Z",
            },
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
    const select = view.getByTestId(
      `org-member-role-${member.id}`,
    ) as HTMLSelectElement;
    fireEvent.change(select, { target: { value: "admin" } });

    await waitFor(() => {
      assert.ok(listCalls >= 1);
      const refreshed = view.getByTestId(
        `org-member-role-${member.id}`,
      ) as HTMLSelectElement;
      assert.equal(refreshed.value, "viewer");
    });
  });

  it("re-fetches list after revoke and shows revoked status from list", async () => {
    let listCalls = 0;
    globalThis.fetch = async (input, init) => {
      const path = String(input);
      const method = String(init?.method ?? "GET");

      if (path.includes("/revoke/") && method === "POST") {
        return new Response(
          JSON.stringify({ ...member, status: "revoked" }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      if (path.endsWith(`/orgs/${orgId}/members/`) && method === "GET") {
        listCalls += 1;
        return new Response(
          JSON.stringify([
            owner,
            { ...member, status: "revoked", role: "member" },
          ]),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      return new Response(JSON.stringify({ detail: "unexpected" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    };

    const { container } = render(createElement(Harness));
    const view = within(container);
    fireEvent.click(view.getByTestId(`org-member-revoke-${member.id}`));

    await waitFor(() => {
      assert.ok(listCalls >= 1);
      // Revoked non-owner loses manage controls; status comes from list.
      assert.equal(view.queryByTestId(`org-member-revoke-${member.id}`), null);
      assert.match(
        view.getByTestId(`org-member-row-${member.id}`).textContent ?? "",
        /revoked/,
      );
    });
  });

  it("shows API error in Alert without refreshing on failure", async () => {
    let listCalls = 0;
    globalThis.fetch = async (input, init) => {
      const path = String(input);
      if (String(init?.method) === "PATCH") {
        return new Response(
          JSON.stringify({ detail: "Cannot change the owner's role; transfer ownership." }),
          {
            status: 403,
            statusText: "Forbidden",
            headers: { "Content-Type": "application/json" },
          },
        );
      }
      if (path.includes("/members/") && !init?.method) {
        listCalls += 1;
      }
      return new Response(JSON.stringify([owner, member]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    };

    const { container } = render(createElement(Harness));
    const view = within(container);
    fireEvent.change(view.getByTestId(`org-member-role-${member.id}`), {
      target: { value: "admin" },
    });

    await waitFor(() => {
      assert.match(
        view.getByTestId("org-members-error").textContent ?? "",
        /Cannot change the owner's role/,
      );
    });
    assert.equal(listCalls, 0);
    assert.equal(
      (view.getByTestId(`org-member-role-${member.id}`) as HTMLSelectElement)
        .value,
      "member",
    );
  });
});
