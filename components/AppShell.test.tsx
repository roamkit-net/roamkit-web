import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { AppShell } from "./AppShell";

describe("AppShell", () => {
  it("composes TopBar + page-content with default max width", () => {
    const html = renderToStaticMarkup(
      createElement(
        AppShell,
        {
          nav: createElement("a", { href: "/plans" }, "← Browse plans"),
          rightSlot: createElement(
            "div",
            { "data-testid": "account-cluster" },
            "Cluster",
          ),
        },
        createElement("p", null, "Body"),
      ),
    );

    assert.match(html, /app-shell/);
    assert.match(html, /app-shell-main--default/);
    assert.match(html, /app-shell-content/);
    assert.match(html, /data-testid="top-bar"/);
    assert.match(html, /grid-cols-\[1fr_auto\]/);
    assert.doesNotMatch(html, /flex-wrap/);
    assert.match(html, /data-testid="page-content"/);
    assert.doesNotMatch(html, /bg-slate-50/);
    assert.match(html, /← Browse plans/);
    assert.match(html, /data-testid="account-cluster"/);
    assert.match(html, /Body/);
  });

  it("honors maxWidth", () => {
    const html = renderToStaticMarkup(
      createElement(
        AppShell,
        {
          maxWidth: "2xl",
          rightSlot: createElement("span", null, "R"),
        },
        createElement("span", null, "C"),
      ),
    );
    assert.match(html, /app-shell-main--narrow/);
  });
});
