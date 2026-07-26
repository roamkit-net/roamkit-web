"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import { AuthForm, AuthShell } from "@/components/AuthForm";
import { ApiError, isAuthenticated, login } from "@/lib/api";
import { safeNextPath } from "@/lib/navigation/safePath";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = safeNextPath(searchParams.get("next"));
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated()) {
      router.replace(nextPath);
    }
  }, [nextPath, router]);

  async function handleSubmit(email: string, password: string) {
    setError(null);
    setIsLoading(true);
    try {
      await login(email, password);
      router.push(nextPath);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Unable to sign in right now.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AuthShell
      title="Sign in"
      subtitle="Access your eSIMs and installation details."
      footer={
        <>
          No account yet?{" "}
          <Link href="/register" className="font-medium text-sky-700 hover:text-sky-800">
            Create one
          </Link>
        </>
      }
    >
      <AuthForm
        submitLabel="Sign in"
        loadingLabel="Signing in…"
        isLoading={isLoading}
        error={error}
        passwordHint={
          <Link
            href="/forgot-password"
            className="font-medium text-sky-700 hover:text-sky-800"
          >
            Forgot password?
          </Link>
        }
        onSubmit={handleSubmit}
      />
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <AuthShell
          title="Sign in"
          subtitle="Access your eSIMs and installation details."
          footer={
            <>
              No account yet?{" "}
              <Link href="/register" className="font-medium text-sky-700 hover:text-sky-800">
                Create one
              </Link>
            </>
          }
        >
          <p className="text-sm text-slate-600">Please wait…</p>
        </AuthShell>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
