"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { AuthForm, AuthShell } from "@/components/AuthForm";
import { ApiError, isAuthenticated, login, registerUser } from "@/lib/api";

export default function RegisterPage() {
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
      await registerUser(email, password);
      await login(email, password);
      router.push("/me/esims");
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

  return (
    <AuthShell
      title="Create account"
      subtitle="Register with email to view your sandbox eSIMs."
      footer={
        <>
          Already registered?{" "}
          <Link href="/login" className="font-medium text-sky-700 hover:text-sky-800">
            Sign in
          </Link>
        </>
      }
    >
      <AuthForm
        submitLabel="Create account"
        loadingLabel="Creating account…"
        isLoading={isLoading}
        error={error}
        passwordAutoComplete="new-password"
        onSubmit={handleSubmit}
      />
    </AuthShell>
  );
}
