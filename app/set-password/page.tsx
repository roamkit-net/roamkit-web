"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import { AuthShell, PasswordPairForm } from "@/components/AuthForm";
import { isTurnstileConfigured } from "@/components/auth/TurnstileField";
import { activateAccount, ApiError, getRememberMePreference, isAuthenticated, login } from "@/lib/api";

function SetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const uid = searchParams.get("uid") ?? "";
  const token = searchParams.get("token") ?? "";

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated()) {
      router.replace("/me/esims");
    }
  }, [router]);

  async function handleSubmit(password: string, passwordConfirm: string) {
    setError(null);

    if (!uid || !token) {
      setError("This confirmation link is missing required details.");
      return;
    }
    if (password !== passwordConfirm) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);
    try {
      const user = await activateAccount(uid, token, password, passwordConfirm);
      // Auto-login needs a Turnstile token when enabled — send user to /login instead.
      if (isTurnstileConfigured()) {
        router.push("/login");
        return;
      }
      await login(user.email, password, undefined, getRememberMePreference());
      router.push("/me/esims");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Unable to set your password right now.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AuthShell
      title="Set your password"
      subtitle="Choose a password to activate your RoamKit account."
      footer={
        <>
          Already activated?{" "}
          <Link href="/login" className="font-medium text-sky-700 hover:text-sky-800">
            Sign in
          </Link>
        </>
      }
    >
      {!uid || !token ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          This confirmation link is invalid or incomplete. Request a new one from{" "}
          <Link href="/register" className="font-medium underline">
            register
          </Link>
          .
        </p>
      ) : (
        <PasswordPairForm
          submitLabel="Activate account"
          loadingLabel="Activating…"
          isLoading={isLoading}
          error={error}
          onSubmit={handleSubmit}
        />
      )}
    </AuthShell>
  );
}

export default function SetPasswordPage() {
  return (
    <Suspense
      fallback={
        <AuthShell
          title="Set your password"
          subtitle="Loading confirmation link…"
          footer={
            <Link href="/login" className="font-medium text-sky-700 hover:text-sky-800">
              Sign in
            </Link>
          }
        >
          <p className="text-sm text-slate-600">Please wait…</p>
        </AuthShell>
      }
    >
      <SetPasswordForm />
    </Suspense>
  );
}
