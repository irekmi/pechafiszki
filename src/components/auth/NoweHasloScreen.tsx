"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { setNewPasswordAction } from "@/app/(auth)/nowe-haslo/actions";
import { initialNoweHasloState } from "@/app/(auth)/nowe-haslo/noweHasloState";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Card, CardFoot } from "@/components/ui/Card";
import { Notice } from "@/components/ui/Notice";
import { Row } from "@/components/ui/Page";
import { Hint } from "@/components/ui/Typography";
import { AlertIcon } from "@/components/ui/icons";
import { NoweHasloPasswordFields } from "./NoweHasloPasswordFields";

/**
 * SCR-04's form and expired-link card — mutually exclusive (task 5's note). `initiallyValid` seeds
 * the state from the page's own load-time check (API-04); a submit that re-validates to invalid
 * (test scenario 4, DEC-46) swaps to the same card with no navigation, because `setNewPasswordAction`
 * returns `{ invalid: true }` rather than throwing.
 */
export function NoweHasloScreen({
  token,
  initiallyValid,
}: {
  token: string;
  initiallyValid: boolean;
}) {
  const [state, formAction, pending] = useActionState(
    setNewPasswordAction,
    initialNoweHasloState(initiallyValid),
  );
  const [attempt, setAttempt] = useState(0);
  const previousState = useRef(state);

  useEffect(() => {
    if (previousState.current !== state) {
      previousState.current = state;
      setAttempt((value) => value + 1);
    }
  }, [state]);

  if (state.invalid) {
    return (
      <Card flat tint>
        <Notice tone="warning" role="alert" icon={<AlertIcon />}>
          Ten link jest już nieaktywny
        </Notice>
        <CardFoot>
          <Row between>
            <Hint>Link wygasł lub został już użyty.</Hint>
            <ButtonLink href="/reset-hasla" size="sm">
              Poproś o nowy link
            </ButtonLink>
          </Row>
        </CardFoot>
      </Card>
    );
  }

  return (
    <form action={formAction} className="grid gap-4">
      <input type="hidden" name="token" value={token} />
      <NoweHasloPasswordFields
        attempt={attempt}
        passwordError={state.passwordError}
        passwordRepeatError={state.passwordRepeatError}
      />
      <Button type="submit" variant="primary" size="lg" block disabled={pending}>
        Zapisz hasło
      </Button>
    </form>
  );
}
