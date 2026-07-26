"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";

import { AuthForm, AuthShell } from "@/components/AuthForm";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import {
  ApiError,
  getRememberMePreference,
  isAuthenticated,
  login,
  loginWithGoogle,
} from "@/lib/api";
import { safeNextPath } from "@/lib/navigation/safePath";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = safeNextPath(searchParams.get("next"));
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  useEffect(() => {
    setRememberMe(getRememberMePreference());
  }, []);

  useEffect(() => {
    if (isAuthenticated()) {
      router.replace(nextPath);
    }
  }, [nextPath, router]);

  async function handleSubmit(
    email: string,
    password: string,
    turnstileToken?: string,
    remember?: boolean,
  ) {
    setError(null);
    setIsLoading(true);
    try {
      await login(email, password, turnstileToken, remember ?? rememberMe);
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

  const handleGoogle = useCallback(
    async (credential: string) => {
      setError(null);
      setIsLoading(true);
      try {
        await loginWithGoogle(credential, rememberMe);
        router.push(nextPath);
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.message);
        } else {
          setError("Unable to sign in with Google right now.");
        }
      } finally {
        setIsLoading(false);
      }
    },
    [nextPath, rememberMe, router],
  );

  return (
    <AuthShell
      title="Sign in"
      subtitle="Access your eSIMs and installation details."
      footer={
        <>
          No account yet?{" "}
          <Link href="/register" className="font-medium">
            Create one
          </Link>
        </>
      }
    >
      <div className="space-y-6">
        <GoogleSignInButton
          onCredential={handleGoogle}
          onError={setError}
          disabled={isLoading}
        />
        <AuthForm
          submitLabel="Sign in"
          loadingLabel="Signing in…"
          isLoading={isLoading}
          error={error}
          showRememberMe
          rememberMe={rememberMe}
          onRememberMeChange={setRememberMe}
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
      </div>
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
              <Link href="/register" className="font-medium">
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
