"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { AppPageHeader } from "@/components/AppPageHeader";
import { AppShell } from "@/components/AppShell";
import { appShellNavLinkClassName } from "@/components/TopBar";
import { DepositCta } from "@/components/billing/DepositCta";
import { EsimListSection } from "@/components/esim/EsimListSection";
import { buttonClassName } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Card, CardSection } from "@/components/ui/Card";
import { Empty } from "@/components/ui/Empty";
import { ListSkeleton } from "@/components/ui/ListSkeleton";
import {
  ApiError,
  Esim,
  User,
  archiveMyEsim,
  clearTokens,
  fetchMe,
  fetchMyEsims,
  isAuthenticated,
  unarchiveMyEsim,
} from "@/lib/api";
import { partitionMyEsims } from "@/lib/esim/display";
import { loginHref } from "@/lib/navigation/safePath";

/**
 * Cap3.3a Golden Route — reference AppShell surface composition
 * (dark shell chrome text + Cap2 elevated Card / ListRow).
 * After pilot smoke: Pilot Freeze — prefer propagate over further edits here.
 */

export default function MyEsimsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [esims, setEsims] = useState<Esim[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const sections = partitionMyEsims(esims);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace(loginHref("/me/esims"));
      return;
    }

    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const [me, list] = await Promise.all([
          fetchMe(),
          fetchMyEsims({ includeArchived: true }),
        ]);
        if (cancelled) {
          return;
        }
        setUser(me);
        setEsims(list.results);
      } catch (err) {
        if (cancelled) {
          return;
        }
        if (err instanceof ApiError && err.status === 401) {
          clearTokens();
          router.replace(loginHref("/me/esims"));
          return;
        }
        setError(
          err instanceof ApiError
            ? "Unable to load your eSIMs right now."
            : "Something went wrong while loading your eSIMs.",
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

  async function handleArchive(esim: Esim) {
    setPendingId(esim.id);
    setActionError(null);
    try {
      const updated = await archiveMyEsim(esim.id);
      setEsims((prev) =>
        prev.map((row) => (row.id === updated.id ? updated : row)),
      );
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        clearTokens();
        router.replace(loginHref("/me/esims"));
        return;
      }
      setActionError("Unable to archive this eSIM right now.");
    } finally {
      setPendingId(null);
    }
  }

  async function handleRestore(esim: Esim) {
    setPendingId(esim.id);
    setActionError(null);
    try {
      const updated = await unarchiveMyEsim(esim.id);
      setEsims((prev) =>
        prev.map((row) => (row.id === updated.id ? updated : row)),
      );
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        clearTokens();
        router.replace(loginHref("/me/esims"));
        return;
      }
      setActionError("Unable to restore this eSIM right now.");
    } finally {
      setPendingId(null);
    }
  }

  return (
    <AppShell
      nav={
        <Link
          href="/plans"
          className={appShellNavLinkClassName}
        >
          ← Browse plans
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
            My eSIMs
          </h1>
        }
        description={
          <p className="max-w-2xl text-base leading-7 text-[var(--app-chrome-text-muted)]">
            {user
              ? `Signed in as ${user.email}. Manage your plans and installation.`
              : "Manage your plans and installation."}
          </p>
        }
        actions={
          <div className="flex flex-wrap gap-3">
            <DepositCta returnPath="/me/esims">Deposit credits</DepositCta>
            <Link
              href="/plans"
              className={buttonClassName({
                variant: "secondary",
                size: "sm",
                tone: "app",
                className:
                  "focus-visible:ring-offset-[var(--app-background)]",
              })}
            >
              Browse plans
            </Link>
          </div>
        }
      />

      {isLoading ? (
        <ListSkeleton rows={3} label="Loading your eSIMs…" />
      ) : error ? (
        <Alert variant="warning" title={error} />
      ) : esims.length === 0 ? (
        <Card>
          <CardSection padding="lg">
            <Empty
              title="No eSIMs yet"
              description={
                <>
                  Deposit credits, then buy a plan from the store — or ask an
                  admin to run{" "}
                  <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">
                    create_sandbox_esim
                  </code>{" "}
                  for your account.
                </>
              }
              action={
                <>
                  <DepositCta variant="primary" returnPath="/me/esims">
                    Deposit credits
                  </DepositCta>
                  <Link
                    href="/plans"
                    className={buttonClassName({
                      variant: "secondary",
                      size: "sm",
                      tone: "app",
                    })}
                  >
                    Browse plans
                  </Link>
                </>
              }
            />
          </CardSection>
        </Card>
      ) : (
        <div className="grid gap-8">
          {actionError ? (
            <Alert variant="warning" title={actionError} />
          ) : null}
          <EsimListSection
            title="Active"
            listId="esim-section-active"
            defaultOpen
            esims={sections.active}
            pendingId={pendingId}
          />
          <EsimListSection
            title="Expired"
            listId="esim-section-expired"
            defaultOpen
            esims={sections.expired}
            action="archive"
            pendingId={pendingId}
            onAction={handleArchive}
          />
          <EsimListSection
            title="Archived"
            listId="esim-section-archived"
            defaultOpen={false}
            esims={sections.archived}
            action="restore"
            pendingId={pendingId}
            onAction={handleRestore}
          />
        </div>
      )}
    </AppShell>
  );
}
