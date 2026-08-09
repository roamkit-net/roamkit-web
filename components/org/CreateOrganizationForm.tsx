"use client";

import { useState, type FormEvent } from "react";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Field, HelpText, Label } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { ApiError } from "@/lib/api";
import { createOrganization } from "@/lib/org/client";

type CreateOrganizationFormProps = {
  onCreated: (organizationId: string) => void;
};

export function CreateOrganizationForm({
  onCreated,
}: CreateOrganizationFormProps) {
  const [name, setName] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Enter an organization name.");
      return;
    }
    setPending(true);
    setError(null);
    try {
      const org = await createOrganization(trimmed);
      onCreated(org.id);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Unable to create organization right now.",
      );
      setPending(false);
    }
  }

  return (
    <form
      onSubmit={(event) => void handleSubmit(event)}
      className="grid gap-4"
      data-testid="org-create-form"
    >
      {error ? (
        <Alert variant="warning" title={error} data-testid="org-create-error" />
      ) : null}
      <Field>
        <Label required>Name</Label>
        <Input
          name="name"
          autoComplete="organization"
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
          data-testid="org-create-name"
        />
        <HelpText>
          You become the owner. This does not move your personal wallet or
          eSIMs.
        </HelpText>
      </Field>
      <div>
        <Button
          type="submit"
          disabled={pending || !name.trim()}
          data-testid="org-create-submit"
        >
          {pending ? "Creating…" : "Create organization"}
        </Button>
      </div>
    </form>
  );
}
