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
          assert.ok(
            classes.includes("inline-flex"),
            `${tone}/${variant}/${size}`,
          );
          assert.match(classes, /rounded-(lg|xl)/);
          assert.match(classes, /text-sm/);
        }
      }
    }
  });

  it("app primary uses --app-* theme tokens (Cap3.4)", () => {
    const classes = buttonClassName({
      variant: "primary",
      size: "sm",
      tone: "app",
    });
    assert.match(classes, /bg-\[var\(--app-primary\)\]/);
    assert.match(classes, /hover:bg-\[var\(--app-primary-hover\)\]/);
    assert.match(classes, /text-\[var\(--app-primary-foreground\)\]/);
    assert.match(classes, /focus-visible:ring-\[var\(--app-focus-ring\)\]/);
    assert.doesNotMatch(classes, /bg-sky-700/);
    assert.match(classes, /rounded-lg/);
    assert.match(classes, /px-3/);
    assert.match(classes, /py-1\.5/);
  });

  it("app tone uses AppShell ring-offset (AuthNav parity)", () => {
    for (const variant of VARIANTS) {
      const classes = buttonClassName({ variant, tone: "app" });
      assert.match(
        classes,
        /focus-visible:ring-offset-\[var\(--app-background\)\]/,
        variant,
      );
    }
    const auth = buttonClassName({ variant: "primary", tone: "auth" });
    assert.doesNotMatch(
      auth,
      /ring-offset-\[var\(--app-background\)\]/,
    );
  });

  it("auth primary uses --auth-* theme tokens (Cap4.2)", () => {
    const classes = buttonClassName({
      variant: "primary",
      size: "md",
      tone: "auth",
    });
    assert.match(classes, /bg-\[var\(--auth-primary\)\]/);
    assert.match(classes, /hover:bg-\[var\(--auth-primary-hover\)\]/);
    assert.match(classes, /text-\[var\(--auth-primary-foreground\)\]/);
    assert.match(classes, /focus-visible:ring-\[var\(--auth-focus-ring\)\]/);
    assert.match(
      classes,
      /focus-visible:ring-offset-\[var\(--auth-background\)\]/,
    );
    assert.doesNotMatch(classes, /bg-cyan-500/);
  });

  it("renders a native button with defaults", () => {
    const html = renderToStaticMarkup(
      createElement(Button, null, "Browse plans"),
    );
    assert.match(html, /<button/);
    assert.match(html, /type="button"/);
    assert.match(html, /Browse plans/);
    assert.match(html, /bg-\[var\(--app-primary\)\]/);
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
    assert.match(html, /bg-\[var\(--auth-primary\)\]/);
  });

  it("secondary app uses slate outline (canonical Cap2.1 secondary)", () => {
    const classes = buttonClassName({ variant: "secondary", size: "sm" });
    assert.match(classes, /border-slate-300/);
    assert.match(classes, /bg-white/);
  });
});
