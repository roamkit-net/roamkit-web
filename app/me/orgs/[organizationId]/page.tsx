"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { AppPageHeader } from "@/components/AppPageHeader";
import { AppShell } from "@/components/AppShell";
import { OrgInviteSection } from "@/components/org/OrgInviteSection";
import { appShellNavLinkClassName } from "@/components/TopBar";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { ListRow } from "@/components/ui/ListRow";
import { ListSkeleton } from "@/components/ui/ListSkeleton";
import { ApiError, clearTokens, isAuthenticated } from "@/lib/api";
import {
  getOrganization,
  listOrganizationMembers,
  listPendingInvites,
} from "@/lib/org/client";
import { canInvite } from "@/lib/org/permissions";
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
            // Members without can_invite should never hit this; treat as soft fail.
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
          <section data-testid="org-members-section" className="grid gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Members</h2>
              <p className="mt-1 text-sm text-slate-600">
                Active and historical membership rows for this organization.
              </p>
            </div>
            <ul className="grid gap-3" data-testid="org-members-list">
              {members.map((member) => (
                <ListRow
                  key={member.id}
                  as="li"
                  trailing={
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="primary">{member.role}</Badge>
                      <Badge
                        variant={
                          member.status === "active" ? "success" : "neutral"
                        }
                      >
                        {member.status}
                      </Badge>
                    </div>
                  }
                >
                  <p className="truncate font-medium text-slate-900">
                    {member.user_email}
                  </p>
                </ListRow>
              ))}
            </ul>
          </section>

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
