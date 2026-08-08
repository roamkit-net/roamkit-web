"use client";

import { useMemo, useState, type FormEvent } from "react";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card, CardSection } from "@/components/ui/Card";
import { Field, HelpText, Label } from "@/components/ui/Field";
import { ApiError } from "@/lib/api";
import {
  getOrganization,
  listOrganizationMembers,
  transferOrganizationOwnership,
} from "@/lib/org/client";
import {
  canTransferOwnership,
  transferOwnershipCandidates,
} from "@/lib/org/permissions";
import type { Membership, Organization } from "@/types/org";

type OrgTransferOwnershipSectionProps = {
  organization: Organization;
  members: Membership[];
  onTransferred: (organization: Organization, members: Membership[]) => void;
};

/**
 * Owner-only transfer UI. After success, always refreshes org detail and
 * members list from the API (no optimistic role swaps).
 */
export function OrgTransferOwnershipSection({
  organization,
  members,
  onTransferred,
}: OrgTransferOwnershipSectionProps) {
  const candidates = useMemo(
    () => transferOwnershipCandidates(members),
    [members],
  );
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [confirm, setConfirm] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!canTransferOwnership(organization) || candidates.length === 0) {
    return null;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!confirm) {
      setError("Confirm that you want to transfer ownership.");
      return;
    }
    const userId = Number(selectedUserId);
    if (!Number.isFinite(userId) || userId <= 0) {
      setError("Select a member to become the new owner.");
      return;
    }

    setPending(true);
    setError(null);
    try {
      await transferOrganizationOwnership(organization.id, userId);
      const [freshOrg, freshMembers] = await Promise.all([
        getOrganization(organization.id),
        listOrganizationMembers(organization.id),
      ]);
      onTransferred(freshOrg, freshMembers);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Unable to transfer ownership right now.",
      );
      setPending(false);
    }
  }

  return (
    <section data-testid="org-transfer-section" className="grid gap-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">
          Transfer ownership
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Make another active member the sole owner. You will become an admin.
        </p>
      </div>

      {error ? (
        <Alert
          variant="warning"
          title={error}
          data-testid="org-transfer-error"
        />
      ) : null}

      <Card>
        <CardSection padding="lg">
          <form
            onSubmit={(event) => void handleSubmit(event)}
            className="grid gap-4"
            data-testid="org-transfer-form"
          >
            <Field>
              <Label required>New owner</Label>
              <select
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900"
                value={selectedUserId}
                required
                onChange={(event) => setSelectedUserId(event.target.value)}
                data-testid="org-transfer-candidate"
              >
                <option value="">Select a member…</option>
                {candidates.map((member) => (
                  <option key={member.id} value={String(member.user_id)}>
                    {member.user_email} ({member.role})
                  </option>
                ))}
              </select>
              <HelpText>
                Only active non-owner members are listed. This cannot be undone
                without another transfer.
              </HelpText>
            </Field>
            <label className="flex items-start gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={confirm}
                onChange={(event) => setConfirm(event.target.checked)}
                data-testid="org-transfer-confirm"
                className="mt-1"
              />
              <span>
                I understand I will lose ownership and become an admin.
              </span>
            </label>
            <div>
              <Button
                type="submit"
                variant="danger"
                disabled={pending || !selectedUserId || !confirm}
                data-testid="org-transfer-submit"
              >
                {pending ? "Transferring…" : "Transfer ownership"}
              </Button>
            </div>
          </form>
        </CardSection>
      </Card>
    </section>
  );
}
