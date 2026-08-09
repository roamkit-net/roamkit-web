"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { AppPageHeader } from "@/components/AppPageHeader";
import { AppShell } from "@/components/AppShell";
import { CreateOrganizationForm } from "@/components/org/CreateOrganizationForm";
import { appShellNavLinkClassName } from "@/components/TopBar";
import { Card, CardSection } from "@/components/ui/Card";
import { ListSkeleton } from "@/components/ui/ListSkeleton";
import { isAuthenticated } from "@/lib/api";
import { loginHref } from "@/lib/navigation/safePath";
import { organizationPath, routes } from "@/lib/routes";

export default function CreateOrganizationPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace(loginHref(routes.orgCreate));
      return;
    }
    setReady(true);
  }, [router]);

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
            Organization
          </p>
        }
        title={
          <h1 className="text-3xl font-bold tracking-tight text-[var(--app-chrome-text)]">
            Create organization
          </h1>
        }
        description={
          <p className="max-w-2xl text-base leading-7 text-[var(--app-chrome-text-muted)]">
            Start a team. You will be the owner and can invite members next.
          </p>
        }
      />

      {!ready ? (
        <ListSkeleton rows={2} label="Checking session…" />
      ) : (
        <Card>
          <CardSection padding="lg">
            <CreateOrganizationForm
              onCreated={(organizationId) => {
                router.replace(organizationPath(organizationId));
              }}
            />
          </CardSection>
        </Card>
      )}
    </AppShell>
  );
}
