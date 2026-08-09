import "./jsdomSetup";

import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import { createElement } from "react";
import {
  cleanup,
  fireEvent,
  render,
  waitFor,
  within,
} from "@testing-library/react";

import { setTokens } from "@/lib/api";

import { AcceptInviteForm } from "./AcceptInviteForm";

const originalFetch = globalThis.fetch;

afterEach(() => {
  cleanup();
  globalThis.fetch = originalFetch;
});

beforeEach(() => {
  setTokens("test-access", "test-refresh");
});

describe("AcceptInviteForm", () => {
  it("accepts token and calls onAccepted with organization id", async () => {
    globalThis.fetch = async () =>
      new Response(
        JSON.stringify({
          organization_id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
          already_accepted: false,
          membership: {
            id: "cccccccc-cccc-cccc-cccc-cccccccccccc",
            user_id: 1,
            user_email: "invitee@example.com",
            role: "member",
            status: "active",
            created_at: "2026-01-01T00:00:00Z",
            updated_at: "2026-01-01T00:00:00Z",
          },
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );

    let acceptedId = "";
    const { container } = render(
      createElement(AcceptInviteForm, {
        initialToken: "tok-1",
        onAccepted: (id) => {
          acceptedId = id;
        },
      }),
    );
    const view = within(container);
    fireEvent.click(view.getByTestId("org-accept-submit"));

    await waitFor(() => {
      assert.equal(acceptedId, "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
    });
  });

  it("shows API error on reject", async () => {
    globalThis.fetch = async () =>
      new Response(
        JSON.stringify({
          detail: "Invite email does not match authenticated user.",
        }),
        {
          status: 400,
          statusText: "Bad Request",
          headers: { "Content-Type": "application/json" },
        },
      );

    const { container } = render(
      createElement(AcceptInviteForm, { onAccepted: () => {} }),
    );
    const view = within(container);
    fireEvent.change(view.getByTestId("org-accept-token"), {
      target: { value: "bad-token" },
    });
    fireEvent.click(view.getByTestId("org-accept-submit"));

    await waitFor(() => {
      assert.match(
        view.getByRole("alert").textContent ?? "",
        /Invite email does not match/,
      );
    });
  });
});
