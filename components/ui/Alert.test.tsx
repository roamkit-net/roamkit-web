import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import {
  Alert,
  alertClassName,
  type AlertSize,
  type AlertVariant,
} from "./Alert";

const VARIANTS: AlertVariant[] = ["info", "success", "warning", "error"];
const SIZES: AlertSize[] = ["sm", "md"];

describe("Alert", () => {
  it("covers variant × size class matrix", () => {
    for (const variant of VARIANTS) {
      for (const size of SIZES) {
        const classes = alertClassName({ variant, size });
        assert.match(classes, /border/);
        assert.match(classes, /rounded-(lg|2xl)/);
      }
    }
  });

  it("warning md matches page amber panel chrome", () => {
    const classes = alertClassName({ variant: "warning", size: "md" });
    assert.match(classes, /border-amber-200/);
    assert.match(classes, /bg-amber-50/);
    assert.match(classes, /text-amber-900/);
    assert.match(classes, /rounded-2xl/);
    assert.match(classes, /p-6/);
  });

  it("error sm matches AuthForm red chrome", () => {
    const classes = alertClassName({ variant: "error", size: "sm" });
    assert.match(classes, /border-red-200/);
    assert.match(classes, /bg-red-50/);
    assert.match(classes, /text-red-800/);
    assert.match(classes, /rounded-lg/);
  });

  it("info uses sky chrome; success uses emerald", () => {
    assert.match(alertClassName({ variant: "info" }), /bg-sky-50/);
    assert.match(alertClassName({ variant: "success" }), /bg-emerald-50/);
  });

  it("renders title, body, and action", () => {
    const html = renderToStaticMarkup(
      createElement(
        Alert,
        {
          variant: "warning",
          title: "Unable to load",
          action: createElement("button", { type: "button" }, "Retry"),
        },
        "Try again later.",
      ),
    );
    assert.match(html, /role="alert"/);
    assert.match(html, /Unable to load/);
    assert.match(html, /Try again later/);
    assert.match(html, /Retry/);
  });

  it("info/success default to role=status", () => {
    const info = renderToStaticMarkup(
      createElement(Alert, { variant: "info" }, "Note"),
    );
    const success = renderToStaticMarkup(
      createElement(Alert, { variant: "success" }, "Saved"),
    );
    assert.match(info, /role="status"/);
    assert.match(success, /role="status"/);
  });
});
