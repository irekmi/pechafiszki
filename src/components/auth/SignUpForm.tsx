"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { signUpAction } from "@/app/(auth)/rejestracja/actions";
import { emptySignUpState } from "@/app/(auth)/rejestracja/signUpState";
import { Button } from "@/components/ui/Button";
import { Field, INVALID_FIELD_CLASS } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { SignUpPasswordFields } from "./SignUpPasswordFields";

/**
 * SCR-02's form. `email` and `nickname` are controlled so they survive a failed attempt
 * (AC-04.4); the password fields (see `SignUpPasswordFields`) are remounted (via `key`) on every
 * submission, the same deterministic clearing `SignInForm` uses, rather than an uncontrolled
 * re-render left to chance.
 */
export function SignUpForm() {
  const [state, formAction, pending] = useActionState(signUpAction, emptySignUpState);
  const [email, setEmail] = useState(state.email);
  const [nickname, setNickname] = useState(state.nickname);
  const [attempt, setAttempt] = useState(0);
  const previousState = useRef(state);

  useEffect(() => {
    setEmail(state.email);
    setNickname(state.nickname);
  }, [state.email, state.nickname]);

  useEffect(() => {
    if (previousState.current !== state) {
      previousState.current = state;
      setAttempt((value) => value + 1);
    }
  }, [state]);

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

      <Field
        label="Pseudonim"
        htmlFor="nickname"
        hint="Pod tym pseudonimem inni zobaczą fiszki, które zgłosisz."
        error={state.nicknameError}
      >
        <Input
          id="nickname"
          name="nickname"
          type="text"
          required
          minLength={3}
          maxLength={24}
          autoComplete="nickname"
          placeholder="np. anna_w"
          value={nickname}
          onChange={(event) => setNickname(event.target.value)}
          className={state.nicknameError ? INVALID_FIELD_CLASS : undefined}
        />
      </Field>

      <SignUpPasswordFields
        attempt={attempt}
        passwordError={state.passwordError}
        passwordRepeatError={state.passwordRepeatError}
      />

      <Button type="submit" variant="primary" size="lg" block disabled={pending}>
        Utwórz konto
      </Button>
    </form>
  );
}
