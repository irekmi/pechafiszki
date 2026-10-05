import { Field, INVALID_FIELD_CLASS } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";

/**
 * SCR-14 element 7's three fields, split out by responsibility (CLAUDE.md §6). `attempt` remounts
 * all three on every submission, clearing the whole form after any refusal — including the current
 * password — rather than leaving one field to an uncontrolled re-render (`SignUpPasswordFields`'s
 * pattern). The **Pokaż** toggle exists only on the two the mockup draws it on.
 */
export function ChangePasswordFields({
  attempt,
  currentError,
  newError,
  repeatError,
}: {
  attempt: number;
  currentError?: string;
  newError?: string;
  repeatError?: string;
}) {
  return (
    <>
      <Field label="Obecne hasło" htmlFor="current_password" error={currentError}>
        <PasswordInput
          key={`current-${attempt}`}
          id="current_password"
          name="current_password"
          required
          autoComplete="current-password"
          placeholder="Twoje obecne hasło"
          className={currentError ? INVALID_FIELD_CLASS : undefined}
        />
      </Field>

      <Field label="Nowe hasło" htmlFor="new_password" error={newError}>
        <PasswordInput
          key={`new-${attempt}`}
          id="new_password"
          name="new_password"
          required
          minLength={8}
          autoComplete="new-password"
          placeholder="Minimum 8 znaków"
          className={newError ? INVALID_FIELD_CLASS : undefined}
        />
      </Field>

      <Field label="Powtórz nowe hasło" htmlFor="new_password_repeat" error={repeatError}>
        <Input
          key={`repeat-${attempt}`}
          id="new_password_repeat"
          name="new_password_repeat"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          placeholder="Powtórz to samo hasło"
          className={repeatError ? INVALID_FIELD_CLASS : undefined}
        />
      </Field>
    </>
  );
}
