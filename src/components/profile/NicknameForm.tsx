"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useToastBoard } from "@/components/ui/ToastBoard";
import { updateNicknameAction } from "@/server/actions/updateNickname";
import { Button } from "@/components/ui/Button";
import { Card, CardFoot, CardHead, CardTitle } from "@/components/ui/Card";
import { Field, INVALID_FIELD_CLASS } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Row } from "@/components/ui/Page";

/**
 * SCR-14 element 6 (API-35). The field is controlled so a refusal keeps the typed value (AC-22.2);
 * a save with no error is the toast trigger, detected the same way `SignUpForm` detects a new
 * submission — by the state object's identity, not a separate flag.
 */
export function NicknameForm({ nickname }: { nickname: string }) {
  const [state, formAction, pending] = useActionState(updateNicknameAction, { nickname });
  const notify = useToastBoard();
  const [value, setValue] = useState(state.nickname);
  const previous = useRef(state);

  useEffect(() => {
    setValue(state.nickname);
    if (previous.current !== state) {
      previous.current = state;
      if (!state.error) notify("Zmiany zapisane");
    }
  }, [state, notify]);

  return (
    <Card>
      <CardHead>
        <CardTitle>Pseudonim</CardTitle>
      </CardHead>
      <form action={formAction} className="grid gap-3.5">
        <Field label="Pseudonim" htmlFor="nickname" error={state.error}>
          <Input
            id="nickname"
            name="nickname"
            type="text"
            required
            minLength={3}
            maxLength={24}
            value={value}
            onChange={(event) => setValue(event.target.value)}
            className={state.error ? INVALID_FIELD_CLASS : undefined}
          />
        </Field>
        <CardFoot>
          <Row className="justify-end">
            <Button type="submit" variant="primary" disabled={pending}>
              Zapisz zmiany
            </Button>
          </Row>
        </CardFoot>
      </form>
    </Card>
  );
}
