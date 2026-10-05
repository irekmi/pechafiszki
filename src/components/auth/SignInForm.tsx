"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { signInAction } from "@/app/(auth)/logowanie/actions";
import { emptySignInState } from "@/app/(auth)/logowanie/signInState";
import { Button } from "@/components/ui/Button";
import { Field, INVALID_FIELD_CLASS } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Notice } from "@/components/ui/Notice";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { AlertIcon, CheckIcon } from "@/components/ui/icons";

/**
 * SCR-01's form. The e-mail is controlled so it survives a failed attempt. The password field is
 * remounted (via `key`) on every submission rather than left to an uncontrolled re-render to clear
 * itself: `key` forces React to discard the old DOM node deterministically, which is what row 2
 * ("the password is cleared") needs guaranteed, not merely usual, in a sign-in form (AC-03.2).
 *
 * `initialNotice` (from `?zmiana=`, e.g. SCR-04's "Hasło zmienione…") shows only until the first
 * submit attempt — a stale success notice must not survive a later sign-in error.
 */
export function SignInForm({
  returnTo,
  initialNotice,
}: {
  returnTo: string;
  initialNotice?: string;
}) {
  const [state, formAction, pending] = useActionState(signInAction, emptySignInState);
  const [email, setEmail] = useState(state.email);
  const [attempt, setAttempt] = useState(0);
  const previousState = useRef(state);

  useEffect(() => {
    if (state.email) setEmail(state.email);
  }, [state.email]);

  useEffect(() => {
    if (previousState.current !== state) {
      previousState.current = state;
      setAttempt((value) => value + 1);
    }
  }, [state]);

  return (
    <>
      {attempt === 0 && initialNotice ? (
        <Notice tone="success" role="status" icon={<CheckIcon />}>
          {initialNotice}
        </Notice>
      ) : null}

      {state.message ? (
        <Notice tone="danger" role="alert" icon={<AlertIcon />}>
          {state.message}
        </Notice>
      ) : null}

      <form action={formAction} className="grid gap-4">
        <input type="hidden" name="powrot" value={returnTo} />

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

        <Field label="Hasło" htmlFor="password" error={state.passwordError}>
          <PasswordInput
            key={attempt}
            id="password"
            name="password"
            required
            minLength={8}
            autoComplete="current-password"
            placeholder="Twoje hasło"
            className={state.passwordError ? INVALID_FIELD_CLASS : undefined}
          />
        </Field>

        <Button type="submit" variant="primary" size="lg" block disabled={pending}>
          Zaloguj się
        </Button>
      </form>
    </>
  );
}
