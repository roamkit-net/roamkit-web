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
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

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
    <Alert
      variant="error"
      size="sm"
      aria-live="polite"
      aria-atomic="true"
    >
      {error}
    </Alert>
  );
}

function SubmitSpinner() {
  return (
    <span
      aria-hidden="true"
      className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-slate-950/30 border-t-slate-950"
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
    <Button
      type="submit"
      tone="auth"
      size="md"
      variant="primary"
      disabled={isDisabled}
      aria-busy={isLoading}
      className="w-full"
    >
      {isLoading ? <SubmitSpinner /> : null}
      {isLoading ? loadingLabel : submitLabel}
    </Button>
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
      <Input
        id="email"
        name="email"
        type="email"
        label="Email"
        autoComplete="email"
        autoFocus
        required
        tone="auth"
      />
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
            className="h-4 w-4 rounded border-slate-300 text-cyan-600 outline-none ring-cyan-500 focus-visible:ring-2"
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
      <Input
        id="email"
        name="email"
        type="email"
        label="Email"
        autoComplete="email"
        autoFocus
        required
        tone="auth"
      />

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
