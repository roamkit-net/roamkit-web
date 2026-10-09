"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";

import { AuthShell, EmailOnlyForm } from "@/components/AuthForm";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import {
  ApiError,
  getRememberMePreference,
  isAuthenticated,
  loginWithGoogle,
  registerUser,
} from "@/lib/api";
import {
  accountExistsLoginPath,
  googleLandingPath,
  isAccountExistsCode,
  isInviteRegistration,
  registerLandingPath,
} from "@/lib/partner/inviteFlow";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromInvite = isInviteRegistration(searchParams.get("from"));
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated()) {
      router.replace(
        registerLandingPath({ fromInvite, authenticated: true }),
      );
    }
  }, [fromInvite, router]);

  async function handleSubmit(email: string, turnstileToken?: string) {
    setError(null);
    setIsLoading(true);
    try {
      const result = await registerUser(email, turnstileToken);
      if ("code" in result && isAccountExistsCode(result.code)) {
        router.replace(accountExistsLoginPath());
        return;
      }
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
        router.push(googleLandingPath());
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
            <Link href="/login" className="font-medium">
              Sign in
            </Link>
          </>
        }
      >
        <p className="text-sm leading-6 text-slate-600">
          Didn&apos;t get the email? Check spam, or{" "}
          <button
            type="button"
            className="font-medium text-cyan-700 transition hover:text-cyan-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-1"
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
          <Link href="/login" className="font-medium">
            Sign in
          </Link>
        </>
      }
    >
      <div className="space-y-6">
        {fromInvite ? (
          <p className="text-sm leading-6 text-[var(--auth-chrome-text-muted)]">
            Register through this invitation to join the partner account. If
            this invitation includes a registration bonus, it will be added
            after your account is successfully created and verified.
          </p>
        ) : null}
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

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <AuthShell
          title="Create account"
          subtitle="Enter your email and we will send a confirmation link to set your password."
          footer={
            <>
              Already registered?{" "}
              <Link href="/login" className="font-medium">
                Sign in
              </Link>
            </>
          }
        >
          <p className="text-sm text-[var(--auth-chrome-text-muted)]">Loading…</p>
        </AuthShell>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}
