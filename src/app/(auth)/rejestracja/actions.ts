"use server";

import { redirect } from "next/navigation";
import { signIn } from "@/server/auth";
import { currentUser } from "@/server/permissions";
import { SIGNED_IN_HOME } from "@/server/routeAccess";
import { createAccount, signUpSchema } from "@/server/services/signUp";
import { emptySignUpState, type SignUpState } from "./signUpState";

/**
 * API-01. Only the four documented fields are read; a `role` submitted alongside them is never
 * parsed and could not become anything anyway — the row is always written with `role: "USER"`
 * (CLAUDE.md §8, AC-04.6). On success the same credentials sign the person in immediately (SCR-02
 * behaviour row 1) and land on `/` (SCR-05, SQ-01.1).
 *
 * The page already redirects a signed-in visitor away from SCR-02, but a server action is a public
 * endpoint of its own — it re-checks the session here too (CLAUDE.md §8), so calling it directly
 * cannot create a second account for an already signed-in User or Administrator.
 */

function field(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value : "";
}

export async function signUpAction(
  _previous: SignUpState,
  formData: FormData,
): Promise<SignUpState> {
  if (await currentUser()) redirect(SIGNED_IN_HOME);

  const email = field(formData.get("email"));
  const nickname = field(formData.get("nickname"));
  const parsed = signUpSchema.safeParse({
    email,
    nickname,
    password: field(formData.get("password")),
    password_repeat: field(formData.get("password_repeat")),
  });

  if (!parsed.success) {
    const state: SignUpState = { email: email.trim(), nickname: nickname.trim() };
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (key === "email") state.emailError ??= issue.message;
      if (key === "nickname") state.nicknameError ??= issue.message;
      if (key === "password") state.passwordError ??= issue.message;
      if (key === "password_repeat") state.passwordRepeatError ??= issue.message;
    }
    return state;
  }

  const result = await createAccount(parsed.data);
  if (!result.ok) {
    return {
      email: parsed.data.email,
      nickname: parsed.data.nickname,
      emailError: result.fieldErrors.email,
      nicknameError: result.fieldErrors.nickname,
    };
  }

  // A successful sign-in leaves through a thrown redirect, which must not be swallowed.
  await signIn("credentials", {
    email: parsed.data.email,
    password: parsed.data.password,
    redirectTo: SIGNED_IN_HOME,
  });

  return emptySignUpState;
}
