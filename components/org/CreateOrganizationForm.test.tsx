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

import { CreateOrganizationForm } from "./CreateOrganizationForm";

const originalFetch = globalThis.fetch;

afterEach(() => {
  cleanup();
  globalThis.fetch = originalFetch;
});

beforeEach(() => {
  setTokens("test-access", "test-refresh");
});

const createdOrg = {
  id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
  name: "Fleet Ops",
  status: "active",
  account_id: "cccccccc-cccc-cccc-cccc-cccccccccccc",
  my_role: "owner",
  permissions: {
    can_view: true,
    can_spend: true,
    can_manage_members: true,
    can_invite: true,
    can_transfer_ownership: true,
    can_archive_org: true,
    can_assign_esim: true,
    can_device_bind: true,
  },
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

describe("CreateOrganizationForm", () => {
  it("does not submit blank or whitespace-only names", () => {
    let called = false;
    globalThis.fetch = async () => {
      called = true;
      return new Response("{}", { status: 201 });
    };

    const { container } = render(
      createElement(CreateOrganizationForm, { onCreated: () => {} }),
    );
    const view = within(container);
    const submit = view.getByTestId("org-create-submit") as HTMLButtonElement;
    assert.equal(submit.disabled, true);

    fireEvent.change(view.getByTestId("org-create-name"), {
      target: { value: "   " },
    });
    assert.equal(
      (view.getByTestId("org-create-submit") as HTMLButtonElement).disabled,
      true,
    );
    fireEvent.click(view.getByTestId("org-create-submit"));
    assert.equal(called, false);
  });

  it("POSTs trimmed name and navigates via onCreated", async () => {
    let method = "";
    let path = "";
    let body = "";
    globalThis.fetch = async (input, init) => {
      path = String(input);
      method = String(init?.method ?? "GET");
      body = String(init?.body ?? "");
      return new Response(JSON.stringify(createdOrg), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      });
    };

    let createdId = "";
    const { container } = render(
      createElement(CreateOrganizationForm, {
        onCreated: (id) => {
          createdId = id;
        },
      }),
    );
    const view = within(container);
    fireEvent.change(view.getByTestId("org-create-name"), {
      target: { value: "  Fleet Ops  " },
    });
    fireEvent.click(view.getByTestId("org-create-submit"));

    await waitFor(() => {
      assert.equal(createdId, createdOrg.id);
    });
    assert.equal(method, "POST");
    assert.match(path, /\/api\/v1\/orgs\/$/);
    assert.equal(body, JSON.stringify({ name: "Fleet Ops" }));
  });

  it("shows API error in Alert", async () => {
    globalThis.fetch = async () =>
      new Response(JSON.stringify({ detail: "Organizations feature disabled." }), {
        status: 404,
        statusText: "Not Found",
        headers: { "Content-Type": "application/json" },
      });

    const { container } = render(
      createElement(CreateOrganizationForm, { onCreated: () => {} }),
    );
    const view = within(container);
    fireEvent.change(view.getByTestId("org-create-name"), {
      target: { value: "Fleet" },
    });
    fireEvent.click(view.getByTestId("org-create-submit"));

    await waitFor(() => {
      assert.match(
        view.getByTestId("org-create-error").textContent ?? "",
        /Organizations feature disabled/,
      );
    });
  });
});
