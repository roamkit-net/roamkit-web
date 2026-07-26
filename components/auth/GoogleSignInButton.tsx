"use client";

import { useCallback, useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential?: string }) => void;
            ux_mode?: "popup" | "redirect";
            auto_select?: boolean;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              type?: string;
              theme?: string;
              size?: string;
              text?: string;
              shape?: string;
              width?: number;
            },
          ) => void;
        };
      };
    };
  }
}

const GIS_SCRIPT_SRC = "https://accounts.google.com/gsi/client";

export function isGoogleSignInConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim());
}

type GoogleSignInButtonProps = {
  onCredential: (credential: string) => void | Promise<void>;
  onError?: (message: string) => void;
  disabled?: boolean;
};

export function GoogleSignInButton({
  onCredential,
  onError,
  disabled = false,
}: GoogleSignInButtonProps) {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim() ?? "";
  const containerRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const onCredentialRef = useRef(onCredential);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onCredentialRef.current = onCredential;
  }, [onCredential]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  const handleCredential = useCallback((credential: string) => {
    void onCredentialRef.current(credential);
  }, []);

  useEffect(() => {
    if (!clientId || disabled) {
      setVisible(false);
      return;
    }

    let cancelled = false;
    const parent = containerRef.current;

    function render() {
      if (cancelled || !parent || !window.google?.accounts?.id) {
        return;
      }
      parent.innerHTML = "";
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response) => {
          const credential = response.credential?.trim();
          if (!credential) {
            onErrorRef.current?.("Google sign-in did not return a credential.");
            return;
          }
          handleCredential(credential);
        },
        ux_mode: "popup",
        auto_select: false,
      });
      window.google.accounts.id.renderButton(parent, {
        type: "standard",
        theme: "outline",
        size: "large",
        text: "continue_with",
        shape: "rectangular",
        width: 320,
      });
      setVisible(true);
    }

    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${GIS_SCRIPT_SRC}"]`,
    );
    if (existing) {
      if (window.google?.accounts?.id) {
        render();
      } else {
        existing.addEventListener("load", render);
      }
      return () => {
        cancelled = true;
        existing.removeEventListener("load", render);
      };
    }

    const script = document.createElement("script");
    script.src = GIS_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => render();
    script.onerror = () => {
      setVisible(false);
      onErrorRef.current?.(
        "Google sign-in is unavailable right now. Use email instead.",
      );
    };
    document.head.appendChild(script);

    return () => {
      cancelled = true;
    };
  }, [clientId, disabled, handleCredential]);

  if (!clientId) {
    return null;
  }

  return (
    <div className={visible ? "space-y-4" : "hidden"} aria-hidden={!visible}>
      <div
        ref={containerRef}
        className="flex min-h-[44px] w-full justify-center focus-within:outline-none focus-within:ring-2 focus-within:ring-sky-500 focus-within:ring-offset-2"
        aria-label="Continue with Google"
      />
      <div className="relative">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-slate-200" />
        </div>
        <div className="relative flex justify-center text-xs uppercase tracking-wide">
          <span className="bg-white px-2 text-slate-500">or</span>
        </div>
      </div>
    </div>
  );
}
