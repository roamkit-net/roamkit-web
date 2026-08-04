import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { TopBar } from "./TopBar";

describe("TopBar", () => {
  it("uses CSS grid 1fr_auto and never flex-wrap", () => {
    const html = renderToStaticMarkup(
      createElement(TopBar, {
        nav: createElement("a", { href: "/plans" }, "← Back"),
        rightSlot: createElement("div", { "data-testid": "right" }, "Account"),
      }),
    );

    assert.match(html, /data-testid="top-bar"/);
    assert.match(html, /grid grid-cols-\[1fr_auto\]/);
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
      '<div data-testid="top-bar" class="grid grid-cols-[1fr_auto] items-start gap-4"><div class="min-w-0"><span>Nav</span></div><div class="justify-self-end"><span>Right</span></div></div>',
    );
  });

  it("renders without nav (rightSlot only)", () => {
    const html = renderToStaticMarkup(
      createElement(TopBar, {
        rightSlot: createElement("span", null, "Only right"),
      }),
    );

    assert.match(html, /Only right/);
    assert.match(html, /grid-cols-\[1fr_auto\]/);
  });
});
