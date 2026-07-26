"use client";

import Link from "next/link";
import type { FormEvent, ReactNode } from "react";
import { useState } from "react";

import {
  TurnstileField,
  isTurnstileConfigured,
} from "@/components/auth/TurnstileField";
import { PasswordField } from "@/components/forms/PasswordField";
import { Logo } from "@/components/landing/Logo";

type AuthShellProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
};

export function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  return (
    <div className="auth-page-bg min-h-screen px-6 py-16 text-slate-100">
      <main className="auth-shell-enter mx-auto w-full max-w-md">
        <Link href="/" className="inline-flex" aria-label="RoamKit home">
          <Logo />
        </Link>
        <h1 className="mt-10 text-3xl font-bold tracking-tight text-white">
          {title}
        </h1>
        <p className="mt-3 text-base leading-7 text-slate-400">{subtitle}</p>
        <div className="mt-8 rounded-3xl border border-white/10 bg-white/95 p-6 text-slate-900 backdrop-blur-sm">
          {children}
        </div>
        <p className="mt-6 text-center text-sm text-slate-400 [&_a]:font-medium [&_a]:text-cyan-400 [&_a]:hover:text-cyan-300">
          {footer}
        </p>
      </main>
    </div>
  );
}

const fieldClassName =
  "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 shadow-sm outline-none ring-sky-500 focus:border-sky-500 focus:ring-2";

const submitButtonClassName =
  "inline-flex w-full items-center justify-center gap-2 rounded-lg bg-sky-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-60";

type SharedFormProps = {
  submitLabel: string;
  loadingLabel: string;
  isLoading: boolean;
  error: string | null;
};

function AuthError({ error }: { error: string | null }) {
  if (!error) {
    return null;
  }
  return (
    <p
      role="alert"
      aria-live="polite"
      aria-atomic="true"
      className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
    >
      {error}
    </p>
  );
}

function SubmitSpinner() {
  return (
    <span
      aria-hidden="true"
      className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
    />
  );
}

function AuthSubmitButton({
  isLoading,
  submitLabel,
  loadingLabel,
  disabled,
}: {
  isLoading: boolean;
  submitLabel: string;
  loadingLabel: string;
  disabled?: boolean;
}) {
  const isDisabled = Boolean(disabled) || isLoading;
  return (
    <button
      type="submit"
      disabled={isDisabled}
      aria-busy={isLoading}
      className={submitButtonClassName}
    >
      {isLoading ? <SubmitSpinner /> : null}
      {isLoading ? loadingLabel : submitLabel}
    </button>
  );
}

function useTurnstileGate() {
  const turnstileRequired = isTurnstileConfigured();
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [resetSignal, setResetSignal] = useState(0);

  const submitDisabled = turnstileRequired && !turnstileToken;

  return {
    turnstileRequired,
    turnstileToken,
    setTurnstileToken,
    resetSignal,
    submitDisabled,
    consumeToken: () => {
      if (!turnstileRequired) {
        return;
      }
      setTurnstileToken(null);
      setResetSignal((n) => n + 1);
    },
  };
}

type AuthFormProps = SharedFormProps & {
  passwordAutoComplete?: "current-password" | "new-password";
  passwordHint?: ReactNode;
  showRememberMe?: boolean;
  rememberMe?: boolean;
  onRememberMeChange?: (value: boolean) => void;
  onSubmit: (
    email: string,
    password: string,
    turnstileToken?: string,
    rememberMe?: boolean,
  ) => Promise<void> | void;
};

export function AuthForm({
  submitLabel,
  loadingLabel,
  isLoading,
  error,
  passwordAutoComplete = "current-password",
  passwordHint,
  showRememberMe = false,
  rememberMe = true,
  onRememberMeChange,
  onSubmit,
}: AuthFormProps) {
  const {
    turnstileToken,
    setTurnstileToken,
    resetSignal,
    submitDisabled,
    consumeToken,
  } = useTurnstileGate();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isLoading || submitDisabled) {
      return;
    }
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    try {
      await onSubmit(
        email,
        password,
        turnstileToken ?? undefined,
        showRememberMe ? rememberMe : undefined,
      );
    } finally {
      consumeToken();
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-slate-700"
        >
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          autoFocus
          required
          className={fieldClassName}
        />
      </div>
      <PasswordField
        id="password"
        name="password"
        label="Password"
        hint={passwordHint}
        autoComplete={passwordAutoComplete}
      />

      {showRememberMe ? (
        <div className="flex items-center gap-2">
          <input
            id="remember_me"
            name="remember_me"
            type="checkbox"
            checked={rememberMe}
            onChange={(event) => onRememberMeChange?.(event.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-sky-700 outline-none ring-sky-500 focus-visible:ring-2"
          />
          <label
            htmlFor="remember_me"
            className="text-sm font-medium text-slate-700"
          >
            Remember me
          </label>
        </div>
      ) : null}

      <TurnstileField
        onTokenChange={setTurnstileToken}
        resetSignal={resetSignal}
      />

      <AuthError error={error} />

      <AuthSubmitButton
        isLoading={isLoading}
        submitLabel={submitLabel}
        loadingLabel={loadingLabel}
        disabled={submitDisabled}
      />
    </form>
  );
}

type EmailOnlyFormProps = SharedFormProps & {
  onSubmit: (email: string, turnstileToken?: string) => Promise<void> | void;
};

export function EmailOnlyForm({
  submitLabel,
  loadingLabel,
  isLoading,
  error,
  onSubmit,
}: EmailOnlyFormProps) {
  const {
    turnstileToken,
    setTurnstileToken,
    resetSignal,
    submitDisabled,
    consumeToken,
  } = useTurnstileGate();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isLoading || submitDisabled) {
      return;
    }
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    try {
      await onSubmit(email, turnstileToken ?? undefined);
    } finally {
      consumeToken();
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-slate-700"
        >
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          autoFocus
          required
          className={fieldClassName}
        />
      </div>

      <TurnstileField
        onTokenChange={setTurnstileToken}
        resetSignal={resetSignal}
      />

      <AuthError error={error} />

      <AuthSubmitButton
        isLoading={isLoading}
        submitLabel={submitLabel}
        loadingLabel={loadingLabel}
        disabled={submitDisabled}
      />
    </form>
  );
}

type PasswordPairFormProps = SharedFormProps & {
  onSubmit: (password: string, passwordConfirm: string) => Promise<void> | void;
};

export function PasswordPairForm({
  submitLabel,
  loadingLabel,
  isLoading,
  error,
  onSubmit,
}: PasswordPairFormProps) {
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isLoading) {
      return;
    }
    const formData = new FormData(event.currentTarget);
    const password = String(formData.get("password") ?? "");
    const passwordConfirm = String(formData.get("password_confirm") ?? "");
    await onSubmit(password, passwordConfirm);
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <PasswordField
        id="password"
        name="password"
        label="Password"
        autoComplete="new-password"
        autoFocus
      />
      <PasswordField
        id="password_confirm"
        name="password_confirm"
        label="Confirm password"
        autoComplete="new-password"
      />

      <AuthError error={error} />

      <AuthSubmitButton
        isLoading={isLoading}
        submitLabel={submitLabel}
        loadingLabel={loadingLabel}
      />
    </form>
  );
}
