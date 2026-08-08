"use client";

import { useState, type FormEvent } from "react";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Field, HelpText, Label } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { ApiError } from "@/lib/api";
import { acceptOrganizationInvite } from "@/lib/org/client";

type AcceptInviteFormProps = {
  initialToken?: string;
  onAccepted: (organizationId: string) => void;
};

export function AcceptInviteForm({
  initialToken = "",
  onAccepted,
}: AcceptInviteFormProps) {
  const [token, setToken] = useState(initialToken);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = token.trim();
    if (!trimmed) {
      setError("Paste the invite token you received.");
      return;
    }
    setPending(true);
    setError(null);
    try {
      const result = await acceptOrganizationInvite(trimmed);
      onAccepted(result.organization_id);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Unable to accept this invite right now.",
      );
      setPending(false);
    }
  }

  return (
    <form
      onSubmit={(event) => void handleSubmit(event)}
      className="grid gap-4"
      data-testid="org-accept-form"
    >
      {error ? <Alert variant="warning" title={error} /> : null}
      <Field>
        <Label required>Invite token</Label>
        <Input
          name="token"
          autoComplete="off"
          required
          value={token}
          onChange={(event) => setToken(event.target.value)}
          data-testid="org-accept-token"
        />
        <HelpText>
          Your signed-in email must match the invite. Accept does not move
          wallet balance or eSIM inventory.
        </HelpText>
      </Field>
      <div>
        <Button
          type="submit"
          disabled={pending || !token.trim()}
          data-testid="org-accept-submit"
        >
          {pending ? "Accepting…" : "Accept invite"}
        </Button>
      </div>
    </form>
  );
}
