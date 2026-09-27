"use server";

import { requireUser } from "@/server/permissions";
import { changePassword } from "@/server/services/changePassword";
import type { PasswordState } from "./profileState";

/**
 * API-36, as SCR-14's `useActionState` action. `DEC-46` — nothing here touches another session; the
 * signed-in device continues unchanged whether the change succeeds or not.
 */

const MESSAGE = {
  current: "Obecne hasło jest nieprawidłowe",
  mismatch: "Hasła nie są takie same",
  weak: "Hasło musi mieć co najmniej 8 znaków",
} as const;

function field(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value : "";
}

export async function changePasswordAction(
  _previous: PasswordState,
  formData: FormData,
): Promise<PasswordState> {
  const user = await requireUser();
  const current = field(formData.get("current_password"));
  const next = field(formData.get("new_password"));
  const repeat = field(formData.get("new_password_repeat"));
  const result = await changePassword(user.id, current, next, repeat);
  if (result.ok) return {};
  if (result.error === "current") return { currentError: MESSAGE.current };
  if (result.error === "mismatch") return { repeatError: MESSAGE.mismatch };
  return { newError: MESSAGE.weak };
}
