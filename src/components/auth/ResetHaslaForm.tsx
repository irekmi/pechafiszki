"use client";

import { useActionState, useEffect, useState } from "react";
import { requestPasswordResetAction } from "@/app/(auth)/reset-hasla/actions";
import { emptyResetHaslaState } from "@/app/(auth)/reset-hasla/resetHaslaState";
import { Button } from "@/components/ui/Button";
import { Field, INVALID_FIELD_CLASS } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Notice } from "@/components/ui/Notice";
import { CheckIcon } from "@/components/ui/icons";

/**
 * SCR-03's form and success notice — mutually exclusive (behaviour rows 1/2, task 2's note): the
 * mockup draws both to show each state, but only one ever renders here.
 */
export function ResetHaslaForm() {
  const [state, formAction, pending] = useActionState(
    requestPasswordResetAction,
    emptyResetHaslaState,
  );
  const [email, setEmail] = useState(state.email);

  useEffect(() => {
    setEmail(state.email);
  }, [state.email]);

  if (state.submitted) {
    return (
      <Notice tone="success" role="status" icon={<CheckIcon />}>
        Jeśli konto z tym adresem istnieje, wysłaliśmy na nie link.
      </Notice>
    );
  }

  return (
    <form action={formAction} className="grid gap-4">
      <Field label="E-mail" htmlFor="email" error={state.emailError}>
        <Input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="twoj.adres@example.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className={state.emailError ? INVALID_FIELD_CLASS : undefined}
        />
      </Field>

      <Button type="submit" variant="primary" size="lg" block disabled={pending}>
        Wyślij link
      </Button>
    </form>
  );
}
