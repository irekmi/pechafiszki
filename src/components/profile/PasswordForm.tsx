"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useToastBoard } from "@/components/ui/ToastBoard";
import { changePasswordAction } from "@/server/actions/changePassword";
import { emptyPasswordState } from "@/server/actions/profileState";
import { Button } from "@/components/ui/Button";
import { Card, CardFoot, CardHead, CardTitle } from "@/components/ui/Card";
import { Row } from "@/components/ui/Page";
import { ChangePasswordFields } from "./ChangePasswordFields";

/**
 * SCR-14 element 7 (API-36). A successful change (no field carries an error) is the toast trigger;
 * `DEC-46` — nothing here ends any other session, and this one stays signed in either way.
 */
export function PasswordForm() {
  const [state, formAction, pending] = useActionState(changePasswordAction, emptyPasswordState);
  const notify = useToastBoard();
  const [attempt, setAttempt] = useState(0);
  const previous = useRef(state);

  useEffect(() => {
    if (previous.current !== state) {
      previous.current = state;
      setAttempt((value) => value + 1);
      if (!state.currentError && !state.newError && !state.repeatError) notify("Hasło zmienione");
    }
  }, [state, notify]);

  return (
    <Card>
      <CardHead>
        <CardTitle>Zmiana hasła</CardTitle>
      </CardHead>
      <form action={formAction} className="grid gap-3.5">
        <ChangePasswordFields
          attempt={attempt}
          currentError={state.currentError}
          newError={state.newError}
          repeatError={state.repeatError}
        />
        <CardFoot>
          <Row className="justify-end">
            <Button type="submit" variant="primary" disabled={pending}>
              Zmień hasło
            </Button>
          </Row>
        </CardFoot>
      </form>
    </Card>
  );
}
