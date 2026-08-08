"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import { AppPageHeader } from "@/components/AppPageHeader";
import { AppShell } from "@/components/AppShell";
import { AcceptInviteForm } from "@/components/org/AcceptInviteForm";
import { appShellNavLinkClassName } from "@/components/TopBar";
import { Card, CardSection } from "@/components/ui/Card";
import { ListSkeleton } from "@/components/ui/ListSkeleton";
import { isAuthenticated } from "@/lib/api";
import { loginHref } from "@/lib/navigation/safePath";
import { organizationPath, routes } from "@/lib/routes";

function AcceptInviteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tokenParam = searchParams.get("token") ?? "";
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      const next = tokenParam
        ? `${routes.orgInviteAccept}?token=${encodeURIComponent(tokenParam)}`
        : routes.orgInviteAccept;
      router.replace(loginHref(next));
      return;
    }
    setReady(true);
  }, [router, tokenParam]);

  if (!ready) {
    return <ListSkeleton rows={2} label="Checking session…" />;
  }

  return (
    <Card>
      <CardSection padding="lg">
        <AcceptInviteForm
          initialToken={tokenParam}
          onAccepted={(organizationId) => {
            router.replace(organizationPath(organizationId));
          }}
        />
      </CardSection>
    </Card>
  );
}

export default function AcceptInvitePage() {
  return (
    <AppShell
      nav={
        <Link href={routes.orgs} className={appShellNavLinkClassName}>
          ← Organizations
        </Link>
      }
    >
      <AppPageHeader
        eyebrow={
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--app-chrome-text-muted)]">
            Invite
          </p>
        }
        title={
          <h1 className="text-3xl font-bold tracking-tight text-[var(--app-chrome-text)]">
            Accept organization invite
          </h1>
        }
        description={
          <p className="max-w-2xl text-base leading-7 text-[var(--app-chrome-text-muted)]">
            Paste the single-use token, or open a link that already includes it.
            Your account email must match the invite.
          </p>
        }
      />
      <Suspense fallback={<ListSkeleton rows={2} label="Loading…" />}>
        <AcceptInviteContent />
      </Suspense>
    </AppShell>
  );
}
