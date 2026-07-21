"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import { AuthShell, PasswordPairForm } from "@/components/AuthForm";
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
          <Link href="/login" className="font-medium text-sky-700 hover:text-sky-800">
            Sign in
          </Link>
        }
      >
        <Link
          href="/login"
          className="inline-flex w-full items-center justify-center rounded-lg bg-sky-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-800"
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
          <Link href="/login" className="font-medium text-sky-700 hover:text-sky-800">
            Sign in
          </Link>
        </>
      }
    >
      {!uid || !token ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          This reset link is invalid or incomplete. Request a new one from{" "}
          <Link href="/forgot-password" className="font-medium underline">
            forgot password
          </Link>
          .
        </p>
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
            <Link href="/login" className="font-medium text-sky-700 hover:text-sky-800">
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
