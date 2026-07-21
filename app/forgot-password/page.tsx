"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { AuthShell, EmailOnlyForm } from "@/components/AuthForm";
import { ApiError, isAuthenticated, requestPasswordReset } from "@/lib/api";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated()) {
      router.replace("/me/esims");
    }
  }, [router]);

  async function handleSubmit(email: string) {
    setError(null);
    setIsLoading(true);
    try {
      await requestPasswordReset(email);
      setSubmittedEmail(email);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Unable to send a reset email right now.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  if (submittedEmail) {
    return (
      <AuthShell
        title="Check your email"
        subtitle={`If an account exists for ${submittedEmail}, we sent a password reset link.`}
        footer={
          <>
            Remembered your password?{" "}
            <Link href="/login" className="font-medium text-sky-700 hover:text-sky-800">
              Sign in
            </Link>
          </>
        }
      >
        <p className="text-sm leading-6 text-slate-600">
          Didn&apos;t get the email? Check spam, or{" "}
          <button
            type="button"
            className="font-medium text-sky-700 hover:text-sky-800"
            onClick={() => setSubmittedEmail(null)}
          >
            try again
          </button>
          .
        </p>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Forgot password"
      subtitle="Enter your email and we will send a link to reset your password."
      footer={
        <>
          Remembered your password?{" "}
          <Link href="/login" className="font-medium text-sky-700 hover:text-sky-800">
            Sign in
          </Link>
        </>
      }
    >
      <EmailOnlyForm
        submitLabel="Send reset link"
        loadingLabel="Sending…"
        isLoading={isLoading}
        error={error}
        onSubmit={handleSubmit}
      />
    </AuthShell>
  );
}
