/**
 * What SCR-02's form gets back from API-01. Passwords are never returned (AC-04.4 keeps every
 * *other* typed value, but never the passwords); `email` and `nickname` are, so the person does not
 * retype them after a refusal.
 */
export type SignUpState = {
  email: string;
  nickname: string;
  emailError?: string;
  nicknameError?: string;
  passwordError?: string;
  passwordRepeatError?: string;
};

export const emptySignUpState: SignUpState = { email: "", nickname: "" };
