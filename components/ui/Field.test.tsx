import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { ErrorMessage, Field, HelpText, Label } from "./Field";

describe("Field", () => {
  it("does not invent describedby without help or error slots", () => {
    const html = renderToStaticMarkup(
      createElement(
        Field,
        { id: "solo" },
        createElement(Label, null, "Solo"),
      ),
    );
    assert.match(html, /for="solo"/);
    assert.doesNotMatch(html, /aria-describedby/);
  });

  it("ErrorMessage uses role=alert", () => {
    const html = renderToStaticMarkup(
      createElement(
        Field,
        { id: "f", state: "error" },
        createElement(ErrorMessage, null, "Bad"),
      ),
    );
    assert.match(html, /role="alert"/);
    assert.match(html, /id="f-error"/);
  });

  it("HelpText uses help id", () => {
    const html = renderToStaticMarkup(
      createElement(
        Field,
        { id: "f" },
        createElement(HelpText, null, "Tip"),
      ),
    );
    assert.match(html, /id="f-help"/);
    assert.match(html, /Tip/);
  });
});
