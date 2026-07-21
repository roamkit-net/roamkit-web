"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { AuthForm, AuthShell } from "@/components/AuthForm";
import { ApiError, isAuthenticated, login } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated()) {
      router.replace("/me/esims");
    }
  }, [router]);

  async function handleSubmit(email: string, password: string) {
    setError(null);
    setIsLoading(true);
    try {
      await login(email, password);
      router.push("/me/esims");
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
        onSubmit={handleSubmit}
      />
      <p className="mt-4 text-center text-sm text-slate-600">
        <Link
          href="/forgot-password"
          className="font-medium text-sky-700 hover:text-sky-800"
        >
          Forgot password?
        </Link>
      </p>
    </AuthShell>
  );
}
