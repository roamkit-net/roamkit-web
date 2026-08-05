import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { Input, inputControlClassName } from "./Input";

describe("Input", () => {
  it("auth control chrome matches AuthForm fieldClassName", () => {
    const classes = inputControlClassName({ tone: "auth" });
    assert.match(classes, /rounded-lg/);
    assert.match(classes, /border-slate-300/);
    assert.match(classes, /ring-cyan-500/);
    assert.match(classes, /focus:border-cyan-500/);
    assert.match(classes, /focus:ring-2/);
    assert.match(classes, /px-3/);
    assert.match(classes, /py-2/);
  });

  it("app tone uses sky focus ring", () => {
    const classes = inputControlClassName({ tone: "app" });
    assert.match(classes, /ring-sky-600/);
  });

  it("error state swaps to red focus chrome", () => {
    const classes = inputControlClassName({ tone: "auth", error: true });
    assert.match(classes, /border-red-300/);
    assert.match(classes, /ring-red-500/);
    assert.doesNotMatch(classes, /ring-cyan-500/);
  });

  it("trailing control adds pr-10 for password toggle clearance", () => {
    const classes = inputControlClassName({
      tone: "auth",
      hasTrailing: true,
    });
    assert.match(classes, /pr-10/);
  });

  it("wires label, describedby hint/error, and aria-invalid", () => {
    const html = renderToStaticMarkup(
      createElement(Input, {
        id: "email",
        label: "Email",
        type: "email",
        name: "email",
        autoComplete: "email",
        required: true,
        hint: "We never share your email.",
        error: "Enter a valid email.",
      }),
    );
    assert.match(html, /for="email"/);
    assert.match(html, /id="email"/);
    assert.match(html, /type="email"/);
    assert.match(html, /autoComplete="email"/);
    assert.match(html, /required/);
    assert.match(html, /aria-invalid="true"/);
    assert.match(html, /aria-describedby="email-error email-hint"/);
    assert.match(html, /id="email-error"/);
    assert.match(html, /Enter a valid email/);
    assert.match(html, /id="email-hint"/);
  });

  it("renders without inventing uncontrolled value", () => {
    const html = renderToStaticMarkup(
      createElement(Input, {
        label: "Name",
        name: "name",
        type: "text",
      }),
    );
    assert.doesNotMatch(html, /\svalue=/);
  });
});
