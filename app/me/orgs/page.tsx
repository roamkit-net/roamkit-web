"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { AppPageHeader } from "@/components/AppPageHeader";
import { AppShell } from "@/components/AppShell";
import { appShellNavLinkClassName } from "@/components/TopBar";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { buttonClassName } from "@/components/ui/Button";
import { Card, CardSection } from "@/components/ui/Card";
import { Empty } from "@/components/ui/Empty";
import { listRowClassName } from "@/components/ui/ListRow";
import { ListSkeleton } from "@/components/ui/ListSkeleton";
import { ApiError, clearTokens, isAuthenticated } from "@/lib/api";
import { listOrganizations } from "@/lib/org/client";
import { loginHref } from "@/lib/navigation/safePath";
import { organizationPath, routes } from "@/lib/routes";
import type { Organization } from "@/types/org";

function statusBadgeVariant(
  status: Organization["status"],
): "success" | "warning" | "neutral" {
  if (status === "active") {
    return "success";
  }
  if (status === "suspended") {
    return "warning";
  }
  return "neutral";
}

export default function OrganizationsPage() {
  const router = useRouter();
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace(loginHref(routes.orgs));
      return;
    }

    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const list = await listOrganizations();
        if (!cancelled) {
          setOrgs(list);
        }
      } catch (err) {
        if (cancelled) {
          return;
        }
        if (err instanceof ApiError && err.status === 401) {
          clearTokens();
          router.replace(loginHref(routes.orgs));
          return;
        }
        setError(
          err instanceof ApiError
            ? err.message
            : "Something went wrong while loading organizations.",
        );
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <AppShell
      nav={
        <Link href={routes.esims} className={appShellNavLinkClassName}>
          ← My eSIMs
        </Link>
      }
    >
      <AppPageHeader
        eyebrow={
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--app-chrome-text-muted)]">
            RoamKit
          </p>
        }
        title={
          <h1 className="text-3xl font-bold tracking-tight text-[var(--app-chrome-text)]">
            Organizations
          </h1>
        }
        description={
          <p className="max-w-2xl text-base leading-7 text-[var(--app-chrome-text-muted)]">
            Teams you belong to. Open one to view members and manage invites.
          </p>
        }
        actions={
          <div className="flex flex-wrap gap-3">
            <Link
              href={routes.orgCreate}
              className={buttonClassName({
                variant: "primary",
                size: "sm",
                tone: "app",
              })}
              data-testid="orgs-create-cta"
            >
              Create organization
            </Link>
            <Link
              href={routes.orgInviteAccept}
              className={buttonClassName({
                variant: "secondary",
                size: "sm",
                tone: "app",
              })}
              data-testid="orgs-accept-cta"
            >
              Accept invite
            </Link>
          </div>
        }
      />

      {isLoading ? (
        <ListSkeleton rows={3} label="Loading organizations…" />
      ) : error ? (
        <Alert variant="warning" title={error} />
      ) : orgs.length === 0 ? (
        <Card>
          <CardSection padding="lg">
            <Empty
              title="No organizations yet"
              description="Create a team to invite members, or accept an invite token you already have."
              action={
                <div className="flex flex-wrap justify-center gap-3">
                  <Link
                    href={routes.orgCreate}
                    className={buttonClassName({
                      variant: "primary",
                      size: "sm",
                      tone: "app",
                    })}
                    data-testid="orgs-create-cta-empty"
                  >
                    Create organization
                  </Link>
                  <Link
                    href={routes.orgInviteAccept}
                    className={buttonClassName({
                      variant: "secondary",
                      size: "sm",
                      tone: "app",
                    })}
                  >
                    Accept invite
                  </Link>
                </div>
              }
            />
          </CardSection>
        </Card>
      ) : (
        <ul className="grid gap-3" data-testid="org-list">
          {orgs.map((org) => (
            <li key={org.id}>
              <Link
                href={organizationPath(org.id)}
                className={listRowClassName({ interactive: true })}
                data-testid={`org-list-item-${org.id}`}
              >
                <div className="flex w-full min-w-0 items-center gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-slate-900">
                      {org.name}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      Your role: {org.my_role}
                    </p>
                  </div>
                  <Badge variant={statusBadgeVariant(org.status)}>
                    {org.status}
                  </Badge>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}
