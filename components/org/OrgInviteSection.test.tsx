import "./jsdomSetup";

import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import { createElement, useState, type ReactElement } from "react";
import {
  act,
  cleanup,
  fireEvent,
  render,
  waitFor,
  within,
} from "@testing-library/react";

import { setTokens } from "@/lib/api";
import type { OrganizationInvite } from "@/types/org";

import { OrgInviteSection } from "./OrgInviteSection";

const originalFetch = globalThis.fetch;

const invite: OrganizationInvite = {
  id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
  organization_id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
  email: "new@example.com",
  email_normalized: "new@example.com",
  display_name: "",
  role: "member",
  status: "pending",
  expires_at: "2026-01-08T00:00:00Z",
  invited_by_email: "owner@example.com",
  accepted_at: null,
  revoked_at: null,
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

function Harness(): ReactElement {
  const [invites, setInvites] = useState<OrganizationInvite[]>([]);
  return createElement(OrgInviteSection, {
    organizationId: invite.organization_id,
    invites,
    onInvitesChange: setInvites,
  });
}

describe("OrgInviteSection", () => {
  it("shows plaintext token only after create response, not from list reload", async () => {
    globalThis.fetch = async (input, init) => {
      const path = String(input);
      if (path.includes("/invites/") && init?.method === "POST") {
        return new Response(
          JSON.stringify({
            created: true,
            token: "one-time-secret",
            invite,
          }),
          {
            status: 201,
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

    assert.equal(view.queryByTestId("org-invite-token-banner"), null);

    fireEvent.change(view.getByTestId("org-invite-email"), {
      target: { value: "new@example.com" },
    });
    fireEvent.click(view.getByTestId("org-invite-submit"));

    await waitFor(() => {
      assert.ok(view.getByTestId("org-invite-token-banner"));
    });
    assert.match(
      view.getByTestId("org-invite-token-value").textContent ?? "",
      /one-time-secret/,
    );
    assert.ok(view.getByTestId("org-invite-list"));

    // Dismiss clears one-shot state; list rows never expose token.
    fireEvent.click(view.getByTestId("org-invite-token-dismiss"));
    assert.equal(view.queryByTestId("org-invite-token-banner"), null);
    assert.equal(container.textContent?.includes("one-time-secret"), false);
  });

  it("does not render invite manage controls without parent gating — section assumes can_invite", () => {
    const { container } = render(
      createElement(OrgInviteSection, {
        organizationId: invite.organization_id,
        invites: [],
        onInvitesChange: () => {},
      }),
    );
    assert.ok(within(container).getByTestId("org-invite-create-form"));
  });

  it("revokes pending invite via API", async () => {
    let revoked = false;
    globalThis.fetch = async (input, init) => {
      if (String(input).includes("/revoke/") && init?.method === "POST") {
        revoked = true;
        return new Response(JSON.stringify({ ...invite, status: "revoked" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ detail: "unexpected" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    };

    function RevokeHarness(): ReactElement {
      const [invites, setInvites] = useState<OrganizationInvite[]>([invite]);
      return createElement(OrgInviteSection, {
        organizationId: invite.organization_id,
        invites,
        onInvitesChange: setInvites,
      });
    }

    const { container } = render(createElement(RevokeHarness));
    const view = within(container);
    await act(async () => {
      fireEvent.click(view.getByTestId(`org-invite-revoke-${invite.id}`));
    });
    await waitFor(() => {
      assert.equal(revoked, true);
      assert.equal(view.queryByTestId(`org-invite-revoke-${invite.id}`), null);
    });
  });
});
