"use client";

import Link from "next/link";
import type { FormEvent, ReactNode } from "react";

type AuthShellProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
};

export function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  return (
    <div className="min-h-screen bg-slate-50 px-6 py-16 text-slate-900">
      <main className="mx-auto w-full max-w-md">
        <Link
          href="/"
          className="text-sm font-medium text-sky-700 hover:text-sky-800"
        >
          ← Back to home
        </Link>
        <p className="mt-4 text-sm font-semibold uppercase tracking-[0.2em] text-sky-700">
          RoamKit
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight">{title}</h1>
        <p className="mt-3 text-base leading-7 text-slate-600">{subtitle}</p>
        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          {children}
        </div>
        <p className="mt-6 text-center text-sm text-slate-600">{footer}</p>
      </main>
    </div>
  );
}

type AuthFormProps = {
  submitLabel: string;
  loadingLabel: string;
  isLoading: boolean;
  error: string | null;
  passwordAutoComplete?: "current-password" | "new-password";
  onSubmit: (email: string, password: string) => Promise<void> | void;
};

export function AuthForm({
  submitLabel,
  loadingLabel,
  isLoading,
  error,
  passwordAutoComplete = "current-password",
  onSubmit,
}: AuthFormProps) {
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    await onSubmit(email, password);
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
          required
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 shadow-sm outline-none ring-sky-500 focus:border-sky-500 focus:ring-2"
        />
      </div>
      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-slate-700"
        >
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete={passwordAutoComplete}
          required
          minLength={8}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 shadow-sm outline-none ring-sky-500 focus:border-sky-500 focus:ring-2"
        />
      </div>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full rounded-lg bg-sky-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isLoading ? loadingLabel : submitLabel}
      </button>
    </form>
  );
}
