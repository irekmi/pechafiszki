"use server";

import { redirect } from "next/navigation";
import { currentUser } from "@/server/permissions";
import { SIGN_IN_PATH, SIGNED_IN_HOME } from "@/server/routeAccess";
import { setNewPassword, setNewPasswordSchema } from "@/server/services/setNewPassword";
import type { NoweHasloState } from "./noweHasloState";

/**
 * API-05. `setNewPassword` re-validates the token itself (row 5's note: "why API-05 re-validates
 * rather than trusting the page load") — a token that expired between load and submit takes the
 * same `invalid: true` path as one that was never valid, both here and at load (API-04).
 */

function field(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value : "";
}

export async function setNewPasswordAction(
  previous: NoweHasloState,
  formData: FormData,
): Promise<NoweHasloState> {
  if (await currentUser()) redirect(SIGNED_IN_HOME);

  const parsed = setNewPasswordSchema.safeParse({
    token: field(formData.get("token")),
    password: field(formData.get("password")),
    password_repeat: field(formData.get("password_repeat")),
  });

  if (!parsed.success) {
    const state: NoweHasloState = { invalid: previous.invalid };
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (key === "password") state.passwordError ??= issue.message;
      if (key === "password_repeat") state.passwordRepeatError ??= issue.message;
    }
    return state;
  }

  const result = await setNewPassword(parsed.data);
  if (!result.ok) return { invalid: true };

  // A successful save leaves through a thrown redirect, which must not be swallowed.
  redirect(`${SIGN_IN_PATH}?zmiana=haslo-zmienione`);
}
