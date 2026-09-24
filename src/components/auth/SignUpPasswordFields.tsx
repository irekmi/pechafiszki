import { Field, INVALID_FIELD_CLASS } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";

/**
 * SCR-02's two password fields, split out of `SignUpForm` by responsibility (`CLAUDE.md` §6): the
 * **Pokaż** toggle belongs only to the first one, `02-rejestracja.html`'s **Powtórz hasło** is a
 * plain password input. `attempt` remounts both on every submission so a refusal clears them.
 */
export function SignUpPasswordFields({
  attempt,
  passwordError,
  passwordRepeatError,
}: {
  attempt: number;
  passwordError?: string;
  passwordRepeatError?: string;
}) {
  return (
    <>
      <Field label="Hasło" htmlFor="password" error={passwordError}>
        <PasswordInput
          key={`password-${attempt}`}
          id="password"
          name="password"
          required
          minLength={8}
          autoComplete="new-password"
          placeholder="Minimum 8 znaków"
          className={passwordError ? INVALID_FIELD_CLASS : undefined}
        />
      </Field>

      <Field label="Powtórz hasło" htmlFor="password_repeat" error={passwordRepeatError}>
        <Input
          key={`repeat-${attempt}`}
          id="password_repeat"
          name="password_repeat"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          placeholder="Powtórz to samo hasło"
          className={passwordRepeatError ? INVALID_FIELD_CLASS : undefined}
        />
      </Field>
    </>
  );
}
