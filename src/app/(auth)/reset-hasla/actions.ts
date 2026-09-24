"use server";

import { redirect } from "next/navigation";
import { currentUser } from "@/server/permissions";
import { SIGNED_IN_HOME } from "@/server/routeAccess";
import {
  requestPasswordReset,
  requestPasswordResetSchema,
} from "@/server/services/requestPasswordReset";
import { emptyResetHaslaState, type ResetHaslaState } from "./resetHaslaState";

/**
 * API-03. The action reaches the identical `submitted: true` outcome whether or not the address
 * exists — `requestPasswordReset` itself decides nothing that leaks back out (AC-05.1, `CLAUDE.md`
 * §8). As with `signInAction`/`signUpAction`, the session is re-checked here too, not only on the
 * page's GET.
 */

function field(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value : "";
}

export async function requestPasswordResetAction(
  _previous: ResetHaslaState,
  formData: FormData,
): Promise<ResetHaslaState> {
  if (await currentUser()) redirect(SIGNED_IN_HOME);

  const email = field(formData.get("email"));
  const parsed = requestPasswordResetSchema.safeParse({ email });

  if (!parsed.success) {
    return {
      email: email.trim(),
      submitted: false,
      emailError: parsed.error.issues[0]?.message,
    };
  }

  await requestPasswordReset(parsed.data.email);

  return { ...emptyResetHaslaState, submitted: true };
}
