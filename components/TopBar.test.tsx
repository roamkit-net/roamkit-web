import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { TopBar } from "./TopBar";

describe("TopBar", () => {
  it("uses app-topbar chrome classes (grid SoT in CSS)", () => {
    const html = renderToStaticMarkup(
      createElement(TopBar, {
        nav: createElement("a", { href: "/plans" }, "← Back"),
        rightSlot: createElement("div", { "data-testid": "right" }, "Account"),
      }),
    );

    assert.match(html, /data-testid="top-bar"/);
    assert.match(html, /class="app-topbar"/);
    assert.match(html, /app-topbar-nav/);
    assert.match(html, /app-topbar-end/);
    assert.doesNotMatch(html, /flex-wrap/);
    assert.match(html, /← Back/);
    assert.match(html, /data-testid="right"/);
  });

  it("snapshot: pinned right column layout", () => {
    const html = renderToStaticMarkup(
      createElement(TopBar, {
        nav: createElement("span", null, "Nav"),
        rightSlot: createElement("span", null, "Right"),
      }),
    );

    assert.equal(
      html,
      '<div data-testid="top-bar" class="app-topbar"><div class="app-topbar-nav"><span>Nav</span></div><div class="app-topbar-end"><span>Right</span></div></div>',
    );
  });

  it("renders without nav (rightSlot only)", () => {
    const html = renderToStaticMarkup(
      createElement(TopBar, {
        rightSlot: createElement("span", null, "Only right"),
      }),
    );

    assert.match(html, /Only right/);
    assert.match(html, /app-topbar/);
    assert.match(html, /app-topbar-end/);
  });
});
