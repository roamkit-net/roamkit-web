"use client";

import { useState, type FormEvent } from "react";

import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardSection } from "@/components/ui/Card";
import { Empty } from "@/components/ui/Empty";
import { Field, HelpText, Label } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { ListRow } from "@/components/ui/ListRow";
import { ApiError } from "@/lib/api";
import {
  createOrganizationInvite,
  revokeOrganizationInvite,
} from "@/lib/org/client";
import { organizationInviteAcceptPath } from "@/lib/routes";
import type { InviteRole, OrganizationInvite } from "@/types/org";

type IssuedToken = {
  token: string;
  email: string;
  created: boolean;
};

type OrgInviteSectionProps = {
  organizationId: string;
  invites: OrganizationInvite[];
  onInvitesChange: (invites: OrganizationInvite[]) => void;
};

const INVITE_ROLES: { value: InviteRole; label: string }[] = [
  { value: "member", label: "Member" },
  { value: "admin", label: "Admin" },
  { value: "viewer", label: "Viewer" },
];

/**
 * Invite manage UI. Plaintext token is held only in React state after
 * create/refresh — never reconstructed from the invite list.
 */
export function OrgInviteSection({
  organizationId,
  invites,
  onInvitesChange,
}: OrgInviteSectionProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<InviteRole>("member");
  const [pending, setPending] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [issued, setIssued] = useState<IssuedToken | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setCopied(false);
    try {
      const result = await createOrganizationInvite(organizationId, {
        email: email.trim(),
        role,
      });
      // One-shot plaintext — only from this response.
      setIssued({
        token: result.token,
        email: result.invite.email,
        created: result.created,
      });
      const others = invites.filter((row) => row.id !== result.invite.id);
      onInvitesChange([result.invite, ...others]);
      setEmail("");
      setRole("member");
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Unable to create invite right now.",
      );
    } finally {
      setPending(false);
    }
  }

  async function handleRevoke(inviteId: string) {
    setRevokingId(inviteId);
    setError(null);
    try {
      await revokeOrganizationInvite(organizationId, inviteId);
      const revoked = invites.find((row) => row.id === inviteId);
      onInvitesChange(invites.filter((row) => row.id !== inviteId));
      if (
        issued &&
        revoked &&
        revoked.email_normalized === issued.email.trim().toLowerCase()
      ) {
        setIssued(null);
      }
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Unable to revoke invite right now.",
      );
    } finally {
      setRevokingId(null);
    }
  }

  async function copyToken() {
    if (!issued) {
      return;
    }
    try {
      await navigator.clipboard.writeText(issued.token);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <section data-testid="org-invite-section" className="grid gap-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Invites</h2>
        <p className="mt-1 text-sm text-slate-600">
          Pending invites for this organization. Email delivery is not included —
          copy the token once after create or refresh.
        </p>
      </div>

      {error ? <Alert variant="warning" title={error} /> : null}

      {issued ? (
        <Alert
          variant="success"
          title={
            issued.created
              ? "Invite created — copy the token now"
              : "Invite refreshed — copy the new token now"
          }
          data-testid="org-invite-token-banner"
        >
          <p className="mt-2 text-sm text-slate-700">
            For <span className="font-medium">{issued.email}</span>. This token is
            shown only once and cannot be retrieved again.
          </p>
          <code
            data-testid="org-invite-token-value"
            className="mt-3 block break-all rounded-lg bg-white/80 px-3 py-2 font-mono text-xs text-slate-900"
          >
            {issued.token}
          </code>
          <p className="mt-2 break-all text-xs text-slate-600">
            Accept link:{" "}
            <span data-testid="org-invite-accept-path">
              {organizationInviteAcceptPath(issued.token)}
            </span>
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => void copyToken()}
              data-testid="org-invite-token-copy"
            >
              {copied ? "Copied" : "Copy token"}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setIssued(null)}
              data-testid="org-invite-token-dismiss"
            >
              Dismiss
            </Button>
          </div>
        </Alert>
      ) : null}

      <Card>
        <CardSection padding="lg">
          <form
            onSubmit={(event) => void handleCreate(event)}
            className="grid gap-4"
            data-testid="org-invite-create-form"
          >
            <Field>
              <Label required>Email</Label>
              <Input
                type="email"
                name="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                data-testid="org-invite-email"
              />
              <HelpText>
                Creating again for the same email refreshes the pending invite
                and rotates the token.
              </HelpText>
            </Field>
            <Field>
              <Label>Role</Label>
              <select
                name="role"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900"
                value={role}
                onChange={(event) => setRole(event.target.value as InviteRole)}
                data-testid="org-invite-role"
              >
                {INVITE_ROLES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>
            <div>
              <Button
                type="submit"
                disabled={pending || !email.trim()}
                data-testid="org-invite-submit"
              >
                {pending ? "Sending…" : "Create invite"}
              </Button>
            </div>
          </form>
        </CardSection>
      </Card>

      {invites.length === 0 ? (
        <Empty
          title="No pending invites"
          description="Create an invite to share a single-use accept token."
        />
      ) : (
        <ul className="grid gap-3" data-testid="org-invite-list">
          {invites.map((invite) => (
            <ListRow
              key={invite.id}
              as="li"
              trailing={
                <Button
                  type="button"
                  size="sm"
                  variant="danger"
                  disabled={revokingId === invite.id}
                  onClick={() => void handleRevoke(invite.id)}
                  data-testid={`org-invite-revoke-${invite.id}`}
                >
                  {revokingId === invite.id ? "Revoking…" : "Revoke"}
                </Button>
              }
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-slate-900">
                  {invite.email}
                </p>
                <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-600">
                  <Badge variant="neutral">{invite.role}</Badge>
                  <span>
                    Expires{" "}
                    {new Date(invite.expires_at).toLocaleString(undefined, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </span>
                </p>
              </div>
            </ListRow>
          ))}
        </ul>
      )}
    </section>
  );
}
