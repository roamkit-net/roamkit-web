import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { ErrorMessage, Field, HelpText, Label } from "./Field";
import { Input, inputControlClassName } from "./Input";
import { Textarea } from "./Textarea";

describe("inputControlClassName", () => {
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

  it("state=error swaps to red focus chrome", () => {
    const classes = inputControlClassName({ tone: "auth", state: "error" });
    assert.match(classes, /border-red-300/);
    assert.match(classes, /ring-red-500/);
    assert.doesNotMatch(classes, /ring-cyan-500/);
  });

  it("state=success and warning use semantic rings", () => {
    assert.match(
      inputControlClassName({ state: "success" }),
      /ring-emerald-500/,
    );
    assert.match(inputControlClassName({ state: "warning" }), /ring-amber-500/);
  });

  it("end adornment adds pr-10 for toggle clearance", () => {
    const classes = inputControlClassName({
      tone: "auth",
      hasEndAdornment: true,
    });
    assert.match(classes, /pr-10/);
  });
});

describe("Field + Input", () => {
  it("wires label, describedby help/error, and aria-invalid", () => {
    const html = renderToStaticMarkup(
      createElement(
        Field,
        { id: "email", state: "error", tone: "auth" },
        createElement(Label, { required: true }, "Email"),
        createElement(Input, {
          type: "email",
          name: "email",
          autoComplete: "email",
          required: true,
        }),
        createElement(HelpText, null, "We never share your email."),
        createElement(ErrorMessage, null, "Enter a valid email."),
      ),
    );
    assert.match(html, /for="email"/);
    assert.match(html, /id="email"/);
    assert.match(html, /type="email"/);
    assert.match(html, /autoComplete="email"/);
    assert.match(html, /required/);
    assert.match(html, /aria-invalid="true"/);
    assert.match(html, /aria-describedby="email-error email-help"/);
    assert.match(html, /id="email-error"/);
    assert.match(html, /Enter a valid email/);
    assert.match(html, /id="email-help"/);
    assert.match(html, /\(required\)/);
  });

  it("renders without inventing uncontrolled value", () => {
    const html = renderToStaticMarkup(
      createElement(
        Field,
        { id: "name" },
        createElement(Label, null, "Name"),
        createElement(Input, { name: "name", type: "text" }),
      ),
    );
    assert.doesNotMatch(html, /\svalue=/);
  });

  it("keeps keyboard focusability (no tabindex=-1 by default)", () => {
    const html = renderToStaticMarkup(
      createElement(Input, { name: "x", type: "text", id: "x" }),
    );
    assert.doesNotMatch(html, /tabindex="-1"/);
    assert.doesNotMatch(html, /tabIndex="-1"/);
  });

  it("renders start and end adornment slots", () => {
    const html = renderToStaticMarkup(
      createElement(Input, {
        id: "amount",
        name: "amount",
        startAdornment: createElement("span", null, "$"),
        endAdornment: createElement("span", null, "USD"),
      }),
    );
    assert.match(html, />\$<\/span>/);
    assert.match(html, />USD<\/span>/);
    assert.match(html, /pl-10/);
    assert.match(html, /pr-10/);
  });
});

describe("Textarea", () => {
  it("shares Field id and resize-y chrome", () => {
    const html = renderToStaticMarkup(
      createElement(
        Field,
        { id: "note", tone: "app" },
        createElement(Label, null, "Note"),
        createElement(Textarea, { name: "note", rows: 3 }),
      ),
    );
    assert.match(html, /id="note"/);
    assert.match(html, /resize-y/);
    assert.match(html, /ring-sky-600/);
  });
});
