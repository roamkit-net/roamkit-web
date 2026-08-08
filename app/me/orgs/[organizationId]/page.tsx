"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { AppPageHeader } from "@/components/AppPageHeader";
import { AppShell } from "@/components/AppShell";
import { OrgInviteSection } from "@/components/org/OrgInviteSection";
import { OrgMembersSection } from "@/components/org/OrgMembersSection";
import { appShellNavLinkClassName } from "@/components/TopBar";
import { Alert } from "@/components/ui/Alert";
import { ListSkeleton } from "@/components/ui/ListSkeleton";
import { ApiError, clearTokens, isAuthenticated } from "@/lib/api";
import {
  getOrganization,
  listOrganizationMembers,
  listPendingInvites,
} from "@/lib/org/client";
import { canInvite, canManageMembers } from "@/lib/org/permissions";
import { loginHref } from "@/lib/navigation/safePath";
import { organizationPath, routes } from "@/lib/routes";
import type { Membership, Organization, OrganizationInvite } from "@/types/org";

export default function OrganizationDetailPage() {
  const router = useRouter();
  const params = useParams();
  const organizationId =
    typeof params.organizationId === "string" ? params.organizationId : "";

  const [org, setOrg] = useState<Organization | null>(null);
  const [members, setMembers] = useState<Membership[]>([]);
  const [invites, setInvites] = useState<OrganizationInvite[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!organizationId) {
      return;
    }
    if (!isAuthenticated()) {
      router.replace(loginHref(organizationPath(organizationId)));
      return;
    }

    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const organization = await getOrganization(organizationId);
        if (cancelled) {
          return;
        }
        setOrg(organization);

        const memberList = await listOrganizationMembers(organizationId);
        if (cancelled) {
          return;
        }
        setMembers(memberList);

        if (canInvite(organization)) {
          try {
            const pending = await listPendingInvites(organizationId);
            if (!cancelled) {
              setInvites(pending);
            }
          } catch (inviteErr) {
            if (cancelled) {
              return;
            }
            if (
              inviteErr instanceof ApiError &&
              (inviteErr.status === 403 || inviteErr.status === 404)
            ) {
              setInvites([]);
            } else {
              throw inviteErr;
            }
          }
        } else {
          setInvites([]);
        }
      } catch (err) {
        if (cancelled) {
          return;
        }
        if (err instanceof ApiError && err.status === 401) {
          clearTokens();
          router.replace(loginHref(organizationPath(organizationId)));
          return;
        }
        setError(
          err instanceof ApiError
            ? err.message
            : "Something went wrong while loading this organization.",
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
  }, [organizationId, router]);

  const showInvites = canInvite(org);

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
            {org?.name ?? "Organization"}
          </h1>
        }
        description={
          <p className="max-w-2xl text-base leading-7 text-[var(--app-chrome-text-muted)]">
            {org
              ? `Your role: ${org.my_role}. Status: ${org.status}.`
              : "Members and invites for this team."}
          </p>
        }
      />

      {isLoading ? (
        <ListSkeleton rows={4} label="Loading organization…" />
      ) : error ? (
        <Alert variant="warning" title={error} />
      ) : org ? (
        <div className="grid gap-10">
          <OrgMembersSection
            organizationId={org.id}
            members={members}
            canManageMembers={canManageMembers(org)}
            onMembersChange={setMembers}
          />

          {showInvites ? (
            <OrgInviteSection
              organizationId={org.id}
              invites={invites}
              onInvitesChange={setInvites}
            />
          ) : null}
        </div>
      ) : null}
    </AppShell>
  );
}
