/**
 * What SCR-01's form gets back from API-02. It lives beside the action rather than inside it,
 * because a `"use server"` module may export nothing but async functions.
 *
 * One message covers both failure causes, so a wrong password and an address nobody registered are
 * indistinguishable (SCR-01 behaviour row 2, AC-03.2).
 */
export const INVALID_CREDENTIALS = "Nieprawidłowy e-mail lub hasło";

export type SignInState = {
  /** Handed back so the field refills. The password is never returned. */
  email: string;
  message: string | null;
  emailError?: string;
  passwordError?: string;
};

export const emptySignInState: SignInState = { email: "", message: null };
