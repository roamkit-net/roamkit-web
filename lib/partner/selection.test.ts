import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { PartnerContextPicker } from "@/components/partner/PartnerShell";
import {
  partnerCustomersPath,
  partnerGrantsPath,
  partnerInvitePath,
  partnerSummaryPath,
} from "@/lib/partner/client";
import {
  choosePartnerContext,
  partnerContextLabel,
  recoverPartnerContext,
  rowsForChannel,
  type PartnerContextItem,
} from "@/lib/partner/selection";

function context(
  id: string,
  extras: Partial<PartnerContextItem> = {},
): PartnerContextItem {
  return {
    channel_id: id,
    kind: "team",
    label: id,
    effective_role: "viewer",
    is_active: true,
    capabilities: { can_grant: false, can_manage_invite: false },
    ...extras,
  };
}

describe("partner context selection", () => {
  it("shows no channel when the list is empty", () => {
    assert.deepEqual(choosePartnerContext([], null), { status: "unavailable" });
  });

  it("selects the only context", () => {
    const only = context("ind", { kind: "individual", label: "Ante Vrcan" });
    assert.deepEqual(choosePartnerContext([only], null), {
      status: "ready",
      context: only,
      announced: false,
    });
  });

  it("restores a stored channel when several remain", () => {
    const individual = context("ind", { kind: "individual", label: "Ante Vrcan" });
    const team = context("team", { label: "Acme Travel" });
    const selected = choosePartnerContext([individual, team], "team");
    assert.equal(selected.status, "ready");
    if (selected.status === "ready") {
      assert.equal(selected.context.channel_id, "team");
    }
  });

  it("asks for a choice when the stored channel is gone", () => {
    const team = context("team", { label: "Acme Travel" });
    const other = context("other", { label: "Other Travel" });
    assert.deepEqual(choosePartnerContext([team, other], "missing"), {
      status: "choose",
    });
  });

  it("keeps an inactive context selectable", () => {
    const paused = context("team", { is_active: false, label: "Acme Travel" });
    const selected = choosePartnerContext([paused], null);
    assert.equal(selected.status, "ready");
    if (selected.status === "ready") {
      assert.equal(selected.context.is_active, false);
    }
  });

  it("does not switch to another channel after access loss when several remain", () => {
    const denied = context("gone");
    const left = context("left");
    const right = context("right");
    assert.deepEqual(recoverPartnerContext([denied, left, right], "gone"), {
      status: "choose",
    });
  });

  it("announces the only remaining channel after access loss", () => {
    const left = context("left", { label: "Acme Travel" });
    const selected = recoverPartnerContext([context("gone"), left], "gone");
    assert.deepEqual(selected, {
      status: "ready",
      context: left,
      announced: true,
    });
  });

  it("hides rows loaded for a different channel", () => {
    assert.equal(rowsForChannel("b", "a", ["old"]), null);
    assert.deepEqual(rowsForChannel("a", "a", ["old"]), ["old"]);
  });

  it("keeps only the channel that is current when a slow response arrives late", () => {
    let visible = "a";
    const shown: string[] = [];
    function arrive(requested: string, payload: string) {
      if (rowsForChannel(visible, requested, payload) !== null) {
        shown.push(payload);
      }
    }
    visible = "b";
    arrive("b", "b-summary");
    arrive("a", "late-a-summary");
    arrive("a", "late-a-customers");
    arrive("b", "b-grants");
    assert.deepEqual(shown, ["b-summary", "b-grants"]);
  });

  it("submits the channel the page rendered, not a newer stored id", () => {
    const rendered = "channel-a";
    const storedAfterAnotherTab = "channel-b";
    const submitted = rendered;
    assert.equal(submitted, "channel-a");
    assert.notEqual(submitted, storedAfterAnotherTab);
  });
});

describe("partner context labels", () => {
  it("shows kind and role and hides account ids", () => {
    const html = renderToStaticMarkup(
      createElement(PartnerContextPicker, {
        contexts: [
          context("11111111-1111-1111-1111-111111111111", {
            kind: "individual",
            label: "Ante Vrcan",
            effective_role: "owner",
          }),
          context("22222222-2222-2222-2222-222222222222", {
            label: "Acme Travel",
            effective_role: "admin",
            is_active: false,
          }),
        ],
        value: "11111111-1111-1111-1111-111111111111",
        onSelect: () => undefined,
      }),
    );
    assert.match(html, /Ante Vrcan — Individual · owner/);
    assert.match(html, /Acme Travel — Team · admin · paused/);
    assert.equal(html.includes("account"), false);
    assert.equal(
      partnerContextLabel(
        context("x", { kind: "individual", label: "Ante Vrcan", effective_role: "owner" }),
      ),
      "Ante Vrcan — Individual · owner",
    );
  });
});

describe("partner channel paths", () => {
  const channelId = "11111111-1111-1111-1111-111111111111";

  it("scopes reads and the grant mutation to the page channel", () => {
    assert.equal(
      partnerSummaryPath(channelId),
      `/api/v1/partner/channels/${channelId}/summary/`,
    );
    assert.equal(
      partnerCustomersPath(channelId, new URLSearchParams({ page: "1" })),
      `/api/v1/partner/channels/${channelId}/customers/?page=1`,
    );
    assert.equal(
      partnerGrantsPath(channelId, new URLSearchParams()),
      `/api/v1/partner/channels/${channelId}/grants/`,
    );
    assert.equal(
      partnerInvitePath(channelId, "regenerate"),
      `/api/v1/partner/channels/${channelId}/invite-link/regenerate/`,
    );
    assert.equal(partnerGrantsPath(channelId, new URLSearchParams()).includes("billing"), false);
    assert.equal(partnerSummaryPath(channelId).includes("/orgs/partner/"), false);
  });
});
