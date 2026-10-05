import type { Role } from "@prisma/client";

/** Why an account may neither change role nor be deleted by the caller (DEC-47). `null` means it may. */
export type AccountBlock = "self" | "last-admin" | null;

/**
 * The two blocks of API-33 / API-34, as one pure rule. `admins` is the number of administrators in the
 * whole system (DEC-47). Self wins when both apply: a sole administrator looking at their own row is
 * told to use their profile (AC-18.1); either way the write is refused.
 */
export function accountBlock(target: { id: number; role: Role }, callerId: number, admins: number): AccountBlock {
  if (target.id === callerId) return "self";
  return target.role === "ADMIN" && admins <= 1 ? "last-admin" : null;
}

/** The tooltip of SCR-19's inactive **Usuń użytkownika** (API-31 `blockReason`). */
export const ROW_TOOLTIP: Record<Exclude<AccountBlock, null>, string> = {
  self: "Użyj swojego profilu, aby usunąć własne konto",
  "last-admin": "To jedyny administrator",
};

/** The note under SCR-20's inactive buttons, and the refusal message of both actions (API-32, API-33). */
export const BLOCK_NOTE: Record<Exclude<AccountBlock, null>, string> = {
  self: "Nie możesz zmienić własnej roli ani usunąć własnego konta w tym miejscu",
  "last-admin": "To jedyny administrator. Wyznacz innego wcześniej.",
};
