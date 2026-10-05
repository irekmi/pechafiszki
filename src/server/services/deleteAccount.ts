import type { Prisma } from "@prisma/client";
import { db } from "@/server/db";
import { countAdmins, lockAdminRoster } from "./adminRoster";

type Tx = Prisma.TransactionClient;
export type DeleteAccountResult = { ok: true } | { ok: false; reason: "not-found" | "last-admin" };

/**
 * The deletion itself (DEC-39, DEC-40, DEC-41), for a caller that already holds the roster lock inside
 * `tx`. Refuses the last administrator; deletes the account's PENDING and REJECTED cards outright; then
 * deletes the user, and the database does the rest: progress, review events, sessions and reset tokens
 * cascade, approved cards keep existing with a null author (rendered "Usunięty użytkownik"), and a
 * moderation decision keeps its record with a null decider.
 */
export async function deleteAccountIn(tx: Tx, id: number): Promise<DeleteAccountResult> {
  const target = await tx.user.findUnique({ where: { id }, select: { role: true } });
  if (!target) return { ok: false, reason: "not-found" };
  if (target.role === "ADMIN" && (await countAdmins(tx)) <= 1) return { ok: false, reason: "last-admin" };
  await tx.flashcard.deleteMany({ where: { authorId: id, status: { in: ["PENDING", "REJECTED"] } } });
  await tx.user.delete({ where: { id } });
  return { ok: true };
}

/**
 * The one account-deletion service (DEC-41): API-34 calls it through `deleteUser`, and ST-22's API-37
 * calls it with the caller's own id — the last administrator cannot delete themselves either. The
 * caller has already passed its own permission check.
 */
export async function deleteAccount(id: number): Promise<DeleteAccountResult> {
  return db.$transaction(async (tx) => {
    await lockAdminRoster(tx);
    return deleteAccountIn(tx, id);
  });
}
