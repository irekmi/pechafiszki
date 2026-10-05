/**
 * What SCR-03's form gets back from API-03. `submitted` is the whole state machine: once true, the
 * form is gone and the success notice takes its place — never both, and never a way back to the
 * form on this same page load (SCR-03 behaviour rows 1/2).
 */
export type ResetHaslaState = {
  email: string;
  emailError?: string;
  submitted: boolean;
};

export const emptyResetHaslaState: ResetHaslaState = { email: "", submitted: false };
