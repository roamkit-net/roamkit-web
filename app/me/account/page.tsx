"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

import { AppPageHeader } from "@/components/AppPageHeader";
import { AppShell } from "@/components/AppShell";
import { appShellNavLinkClassName } from "@/components/TopBar";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card, CardSection } from "@/components/ui/Card";
import { Field, HelpText, Label } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { ListSkeleton } from "@/components/ui/ListSkeleton";
import { accountLabel, publishAccountLabel } from "@/lib/accountLabel";
import {
  ApiError,
  clearTokens,
  fetchMe,
  isAuthenticated,
  updateDisplayName,
} from "@/lib/api";
import { loginHref } from "@/lib/navigation/safePath";
import { routes } from "@/lib/routes";

export default function AccountPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace(loginHref(routes.account));
      return;
    }
    let cancelled = false;
    async function load() {
      try {
        const me = await fetchMe();
        if (cancelled) {
          return;
        }
        setEmail(me.email);
        setDisplayName(me.display_name);
      } catch (err) {
        if (cancelled) {
          return;
        }
        if (err instanceof ApiError && err.status === 401) {
          clearTokens();
          router.replace(loginHref(routes.account));
          return;
        }
        setError("Unable to load your account.");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [router]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setSaved(false);
    try {
      const me = await updateDisplayName(displayName);
      setDisplayName(me.display_name);
      setEmail(me.email);
      publishAccountLabel(accountLabel(me.display_name, me.email));
      setSaved(true);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        clearTokens();
        router.replace(loginHref(routes.account));
        return;
      }
      setError(err instanceof Error ? err.message : "Unable to save display name.");
    } finally {
      setPending(false);
    }
  }

  return (
    <AppShell
      nav={
        <Link href={routes.esims} className={appShellNavLinkClassName}>
          ← My eSIMs
        </Link>
      }
    >
      <AppPageHeader
        title={
          <h1 className="text-3xl font-bold tracking-tight text-[var(--app-chrome-text)]">
            Display name
          </h1>
        }
        description={
          <p className="max-w-2xl text-base leading-7 text-[var(--app-chrome-text-muted)]">
            This is the name shown in your account menu. Leave it empty to show
            your email.
          </p>
        }
      />
      {loading ? (
        <ListSkeleton label="Loading account…" />
      ) : (
        <Card>
          <CardSection padding="md">
            <form className="max-w-md space-y-4" onSubmit={(event) => void handleSubmit(event)}>
              {error ? <Alert variant="error">{error}</Alert> : null}
              {saved ? <Alert variant="success">Display name saved.</Alert> : null}
              <Field>
                <Label htmlFor="display-name">Display name</Label>
                <Input
                  id="display-name"
                  name="display_name"
                  maxLength={255}
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  autoComplete="nickname"
                />
                <HelpText>
                  {email
                    ? `Shown as ${accountLabel(displayName, email)}.`
                    : "Shown in the account menu."}
                </HelpText>
              </Field>
              <Button type="submit" disabled={pending}>
                {pending ? "Saving…" : "Save"}
              </Button>
            </form>
          </CardSection>
        </Card>
      )}
    </AppShell>
  );
}
