"use client";

import Script from "next/script";
import { useCallback, useEffect, useId, useRef, useState } from "react";

const TURNSTILE_SCRIPT = "https://challenges.cloudflare.com/turnstile/v0/api.js";

export function turnstileSiteKey(): string {
  return process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() ?? "";
}

export function isTurnstileConfigured(): boolean {
  return turnstileSiteKey().length > 0;
}

type TurnstileApi = {
  render: (
    container: HTMLElement,
    options: {
      sitekey: string;
      callback: (token: string) => void;
      "error-callback"?: () => void;
      "expired-callback"?: () => void;
      theme?: "light" | "dark" | "auto";
    },
  ) => string;
  reset: (widgetId?: string) => void;
  remove: (widgetId?: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

type TurnstileFieldProps = {
  onTokenChange: (token: string | null) => void;
  resetSignal?: number;
};

export function TurnstileField({
  onTokenChange,
  resetSignal = 0,
}: TurnstileFieldProps) {
  const siteKey = turnstileSiteKey();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  const onTokenChangeRef = useRef(onTokenChange);
  const [scriptReady, setScriptReady] = useState(false);
  const reactId = useId();

  useEffect(() => {
    onTokenChangeRef.current = onTokenChange;
  }, [onTokenChange]);

  const renderWidget = useCallback(() => {
    if (!siteKey || !containerRef.current || !window.turnstile) {
      return;
    }
    if (widgetIdRef.current) {
      window.turnstile.remove(widgetIdRef.current);
      widgetIdRef.current = null;
    }
    containerRef.current.innerHTML = "";
    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey: siteKey,
      callback: (token: string) => {
        onTokenChangeRef.current(token);
      },
      "error-callback": () => {
        onTokenChangeRef.current(null);
      },
      "expired-callback": () => {
        onTokenChangeRef.current(null);
      },
      theme: "light",
    });
  }, [siteKey]);

  useEffect(() => {
    if (!siteKey) {
      onTokenChangeRef.current(null);
      return;
    }
    if (scriptReady || window.turnstile) {
      setScriptReady(true);
      renderWidget();
    }
    return () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [siteKey, scriptReady, renderWidget]);

  useEffect(() => {
    if (!resetSignal || !widgetIdRef.current || !window.turnstile) {
      return;
    }
    onTokenChangeRef.current(null);
    window.turnstile.reset(widgetIdRef.current);
  }, [resetSignal]);

  if (!siteKey) {
    return null;
  }

  return (
    <div className="space-y-2" data-testid="turnstile-field">
      <Script
        id={`turnstile-script-${reactId}`}
        src={`${TURNSTILE_SCRIPT}?render=explicit`}
        strategy="afterInteractive"
        onLoad={() => setScriptReady(true)}
      />
      {!scriptReady ? (
        <p className="text-sm text-slate-500" aria-live="polite">
          Loading verification…
        </p>
      ) : null}
      <div ref={containerRef} className="cf-turnstile" />
    </div>
  );
}
