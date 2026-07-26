"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { AuthShell, EmailOnlyForm } from "@/components/AuthForm";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import {
  ApiError,
  getRememberMePreference,
  isAuthenticated,
  loginWithGoogle,
  registerUser,
} from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated()) {
      router.replace("/me/esims");
    }
  }, [router]);

  async function handleSubmit(email: string, turnstileToken?: string) {
    setError(null);
    setIsLoading(true);
    try {
      await registerUser(email, turnstileToken);
      setSubmittedEmail(email);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Unable to create your account right now.");
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
        await loginWithGoogle(credential, getRememberMePreference());
        router.push("/me/esims");
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
    [router],
  );

  if (submittedEmail) {
    return (
      <AuthShell
        title="Check your email"
        subtitle={`We sent a confirmation link to ${submittedEmail}. Open it to set your password and activate your account.`}
        footer={
          <>
            Already activated?{" "}
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
      title="Create account"
      subtitle="Enter your email and we will send a confirmation link to set your password."
      footer={
        <>
          Already registered?{" "}
          <Link href="/login" className="font-medium text-sky-700 hover:text-sky-800">
            Sign in
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
        <EmailOnlyForm
          submitLabel="Send confirmation email"
          loadingLabel="Sending…"
          isLoading={isLoading}
          error={error}
          onSubmit={handleSubmit}
        />
      </div>
    </AuthShell>
  );
}
