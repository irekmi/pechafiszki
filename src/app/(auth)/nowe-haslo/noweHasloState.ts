/**
 * What SCR-04's screen gets back from API-05, and what the page load itself seeds via API-04.
 * `invalid` is the whole state machine: once true, the form is gone and the expired-link card takes
 * its place — never both, and it stays true, since there is no way for a spent token to become
 * valid again on the same page.
 */
export type NoweHasloState = {
  invalid: boolean;
  passwordError?: string;
  passwordRepeatError?: string;
};

export function initialNoweHasloState(tokenValid: boolean): NoweHasloState {
  return { invalid: !tokenValid };
}
