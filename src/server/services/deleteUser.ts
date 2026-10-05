import { db } from "@/server/db";
import { isActiveAdmin, lockAdminRoster } from "./adminRoster";
import { deleteAccountIn } from "./deleteAccount";
import type { UserWriteResult } from "./changeUserRole";

/**
 * API-34 — an administrator removes somebody else's account, through the same deletion as the person's
 * own (DEC-41). Refused for oneself (SCR-23 is that route) and for the last administrator; the caller is
 * re-checked against the database, inside the transaction that holds the roster lock.
 */
export async function deleteUser(callerId: number, targetId: number): Promise<UserWriteResult> {
  return db.$transaction(async (tx) => {
    await lockAdminRoster(tx);
    if (!(await isActiveAdmin(tx, callerId))) return { ok: false, reason: "forbidden" };
    if (targetId === callerId) return { ok: false, reason: "self" };
    return deleteAccountIn(tx, targetId);
  });
}
