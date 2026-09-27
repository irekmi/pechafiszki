/**
 * What SCR-14/SCR-23's forms get back from API-35/36/37. Not a `"use server"` module — a file with
 * that directive may only export async functions, so the constants and shapes those actions return
 * live here (the same split `rejestracja/signUpState.ts` uses).
 */

export type NicknameState = { nickname: string; error?: string };
export type PasswordState = { currentError?: string; newError?: string; repeatError?: string };
export type DeleteAccountState = { error?: string };

export const emptyPasswordState: PasswordState = {};
export const emptyDeleteAccountState: DeleteAccountState = {};
