"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { deleteOwnAccountAction } from "@/server/actions/deleteOwnAccount";
import { emptyDeleteAccountState } from "@/server/actions/profileState";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Card, CardFoot } from "@/components/ui/Card";
import { Field, INVALID_FIELD_CLASS } from "@/components/ui/Field";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { Row } from "@/components/ui/Page";

/**
 * SCR-23 elements 5–7 (API-37). A wrong password or the last-administrator refusal both return here
 * with `state.error` and remount the field, cleared, the same way `SignInForm` clears its password.
 * Success leaves through the action's own redirect — this component never navigates itself.
 */
export function DeleteAccountForm() {
  const [state, formAction, pending] = useActionState(deleteOwnAccountAction, emptyDeleteAccountState);
  const [attempt, setAttempt] = useState(0);
  const previous = useRef(state);

  useEffect(() => {
    if (previous.current !== state) {
      previous.current = state;
      setAttempt((value) => value + 1);
    }
  }, [state]);

  return (
    <Card>
      <form action={formAction} className="grid gap-4">
        <Field label="Hasło" htmlFor="password" error={state.error}>
          <PasswordInput
            key={attempt}
            id="password"
            name="password"
            required
            autoComplete="current-password"
            placeholder="Potwierdź hasłem, że to Twoje konto"
            className={state.error ? INVALID_FIELD_CLASS : undefined}
          />
        </Field>
        <CardFoot>
          <Row between>
            <ButtonLink href="/profil">Anuluj</ButtonLink>
            <Button type="submit" variant="danger-solid" disabled={pending}>
              Usuń konto trwale
            </Button>
          </Row>
        </CardFoot>
      </form>
    </Card>
  );
}
