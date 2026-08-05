import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import {
  Button,
  buttonClassName,
  type ButtonSize,
  type ButtonTone,
  type ButtonVariant,
} from "./Button";

const VARIANTS: ButtonVariant[] = ["primary", "secondary", "ghost", "danger"];
const SIZES: ButtonSize[] = ["sm", "md", "lg"];
const TONES: ButtonTone[] = ["app", "auth"];

describe("Button", () => {
  it("covers variant × size × tone class matrix", () => {
    for (const tone of TONES) {
      for (const variant of VARIANTS) {
        for (const size of SIZES) {
          const classes = buttonClassName({ variant, size, tone });
          assert.ok(classes.includes("inline-flex"), `${tone}/${variant}/${size}`);
          assert.match(classes, /rounded-(lg|xl)/);
          assert.match(classes, /text-sm/);
        }
      }
    }
  });

  it("app primary sm matches store Buy chrome (sky-700, rounded-lg)", () => {
    const classes = buttonClassName({
      variant: "primary",
      size: "sm",
      tone: "app",
    });
    assert.match(classes, /bg-sky-700/);
    assert.match(classes, /hover:bg-sky-800/);
    assert.match(classes, /rounded-lg/);
    assert.match(classes, /px-3/);
    assert.match(classes, /py-1\.5/);
  });

  it("auth primary md matches AuthForm submit (cyan-500)", () => {
    const classes = buttonClassName({
      variant: "primary",
      size: "md",
      tone: "auth",
    });
    assert.match(classes, /bg-cyan-500/);
    assert.match(classes, /hover:bg-cyan-400/);
    assert.match(classes, /text-slate-950/);
  });

  it("renders a native button with defaults", () => {
    const html = renderToStaticMarkup(
      createElement(Button, null, "Browse plans"),
    );
    assert.match(html, /<button/);
    assert.match(html, /type="button"/);
    assert.match(html, /Browse plans/);
    assert.match(html, /bg-sky-700/);
  });

  it("forwards disabled and type=submit", () => {
    const html = renderToStaticMarkup(
      createElement(
        Button,
        { type: "submit", disabled: true, tone: "auth", size: "md" },
        "Sign in",
      ),
    );
    assert.match(html, /type="submit"/);
    assert.match(html, /disabled/);
    assert.match(html, /bg-cyan-500/);
  });

  it("secondary app uses slate outline (canonical Cap2.1 secondary)", () => {
    const classes = buttonClassName({ variant: "secondary", size: "sm" });
    assert.match(classes, /border-slate-300/);
    assert.match(classes, /bg-white/);
  });
});
