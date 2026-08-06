"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import { AuthShell, PasswordPairForm } from "@/components/AuthForm";
import { Alert } from "@/components/ui/Alert";
import {
  ApiError,
  confirmPasswordReset,
  isAuthenticated,
} from "@/lib/api";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const uid = searchParams.get("uid") ?? "";
  const token = searchParams.get("token") ?? "";

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (isAuthenticated()) {
      router.replace("/me/esims");
    }
  }, [router]);

  async function handleSubmit(password: string, passwordConfirm: string) {
    setError(null);

    if (!uid || !token) {
      setError("This reset link is missing required details.");
      return;
    }
    if (password !== passwordConfirm) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);
    try {
      await confirmPasswordReset(uid, token, password, passwordConfirm);
      setDone(true);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Unable to reset your password right now.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  if (done) {
    return (
      <AuthShell
        title="Password updated"
        subtitle="Your password has been reset. You can sign in with your new password."
        footer={
          <Link href="/login" className="font-medium">
            Sign in
          </Link>
        }
      >
        <Link
          href="/login"
          className="inline-flex w-full items-center justify-center rounded-lg bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2"
        >
          Continue to sign in
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Reset password"
      subtitle="Choose a new password for your RoamKit account."
      footer={
        <>
          Remembered your password?{" "}
          <Link href="/login" className="font-medium">
            Sign in
          </Link>
        </>
      }
    >
      {!uid || !token ? (
        <Alert variant="error" size="sm">
          This reset link is invalid or incomplete. Request a new one from{" "}
          <Link href="/forgot-password" className="font-medium underline">
            forgot password
          </Link>
          .
        </Alert>
      ) : (
        <PasswordPairForm
          submitLabel="Reset password"
          loadingLabel="Resetting…"
          isLoading={isLoading}
          error={error}
          onSubmit={handleSubmit}
        />
      )}
    </AuthShell>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <AuthShell
          title="Reset password"
          subtitle="Loading reset link…"
          footer={
            <Link href="/login" className="font-medium">
              Sign in
            </Link>
          }
        >
          <p className="text-sm text-slate-600">Please wait…</p>
        </AuthShell>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
