import type { Role } from "@prisma/client";
import { db } from "@/server/db";
import { deleteAccount } from "./deleteAccount";
import { verifyCurrentPassword } from "./verifyCurrentPassword";

export const ONLY_ADMIN_NOTE =
  "Jesteś jedynym administratorem. Wyznacz innego na ekranie szczegółów użytkownika, zanim usuniesz swoje konto.";

export type DeleteOwnAccountResult = { ok: true } | { ok: false; error: "password" | "last-admin" };

/**
 * API-37 — the signed-in person removes their own account. The password is verified here; the
 * deletion itself is ST-18's `deleteAccount(id)` unchanged (DEC-41), which also refuses the last
 * administrator under the roster lock (DEC-47) — this function does not repeat that check, only
 * translates its refusal. A `not-found` (the row already gone, e.g. a concurrent admin action) ends
 * the same way as success: the caller's session is invalid either way.
 */
export async function deleteOwnAccount(userId: number, password: string): Promise<DeleteOwnAccountResult> {
  if (!(await verifyCurrentPassword(userId, password))) return { ok: false, error: "password" };
  const result = await deleteAccount(userId);
  if (!result.ok && result.reason === "last-admin") return { ok: false, error: "last-admin" };
  return { ok: true };
}

/**
 * Whether SCR-23 must render the block card instead of the form (DEC-47) — a page-level display
 * read, not the enforcement itself, which lives in `deleteAccount`'s roster-locked count.
 */
export async function isOnlyAdministrator(role: Role): Promise<boolean> {
  if (role !== "ADMIN") return false;
  return (await db.user.count({ where: { role: "ADMIN" } })) <= 1;
}
