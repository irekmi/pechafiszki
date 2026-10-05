"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { z } from "zod";
import { signIn } from "@/server/auth";
import { currentUser } from "@/server/permissions";
import { SIGNED_IN_HOME, safeReturnPath } from "@/server/routeAccess";
import { INVALID_CREDENTIALS, emptySignInState, type SignInState } from "./signInState";

/**
 * API-02. One message covers both failure causes — an address nobody registered and a wrong
 * password — and the returned state is identical in both cases (AC-03.2). The e-mail is handed
 * back so the field refills; the password never leaves the request.
 *
 * Only `email` and `password` are read. A `role` field submitted alongside them is not parsed here
 * and could not be used anyway: the session's role comes from the row (CLAUDE.md §8, AC-03.5).
 *
 * The page already redirects a signed-in visitor away from SCR-01, but a server action is a public
 * endpoint of its own — it re-checks the session here too (CLAUDE.md §8), so calling it directly
 * cannot re-authenticate an already-signed-in User or Administrator as someone else (ISS-05).
 */

const schema = z.object({
  email: z.string().trim().min(1, "E-mail jest wymagany").max(320),
  password: z.string().min(1, "Hasło jest wymagane").max(1024),
});

function field(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value : "";
}

export async function signInAction(
  _previous: SignInState,
  formData: FormData,
): Promise<SignInState> {
  if (await currentUser()) redirect(SIGNED_IN_HOME);

  const email = field(formData.get("email"));
  const parsed = schema.safeParse({ email, password: field(formData.get("password")) });

  if (!parsed.success) {
    const state: SignInState = { email: email.trim(), message: null };
    for (const issue of parsed.error.issues) {
      if (issue.path[0] === "email") state.emailError ??= issue.message;
      if (issue.path[0] === "password") state.passwordError ??= issue.message;
    }
    return state;
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: safeReturnPath(field(formData.get("powrot"))),
    });
  } catch (error) {
    // A successful sign-in leaves through a redirect, which is thrown and must not be swallowed.
    if (error instanceof AuthError) {
      return { email: parsed.data.email, message: INVALID_CREDENTIALS };
    }
    throw error;
  }

  return emptySignInState;
}
