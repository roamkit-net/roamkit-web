import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { TokenIcon, TOKEN_ICON_SRC } from "./TokenIcon";

describe("TokenIcon", () => {
  it("renders next/image with fixed sm/md/lg dimensions", () => {
    const html = renderToStaticMarkup(
      createElement(TokenIcon, { size: "sm" }),
    );
    assert.match(html, /data-testid="token-icon"/);
    assert.match(html, /data-size="sm"/);
    assert.match(html, new RegExp(TOKEN_ICON_SRC.replace(/\//g, "\\/")));
    assert.match(html, /width="14"/);
    assert.match(html, /height="14"/);
    assert.match(html, /aria-hidden/);
  });

  it("defaults to md and decorative (no duplicated SR name)", () => {
    const html = renderToStaticMarkup(createElement(TokenIcon));
    assert.match(html, /data-size="md"/);
    assert.match(html, /width="18"/);
    assert.match(html, /alt=""/);
    assert.match(html, /aria-hidden/);
  });

  it("uses accessible label when provided (standalone)", () => {
    const html = renderToStaticMarkup(
      createElement(TokenIcon, { label: "Polygon USDT", size: "lg" }),
    );
    assert.match(html, /alt="Polygon USDT"/);
    assert.match(html, /width="24"/);
    assert.doesNotMatch(html, /aria-hidden/);
  });

  it("does not apply tint filter rounded or shadow classes", () => {
    const html = renderToStaticMarkup(createElement(TokenIcon));
    assert.doesNotMatch(html, /filter:/);
    assert.doesNotMatch(html, /rounded-/);
    assert.doesNotMatch(html, /shadow-/);
  });
});
