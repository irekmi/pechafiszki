import type { Role } from "@prisma/client";
import { db } from "@/server/db";
import { accountBlock, type AccountBlock } from "./accountBlocks";
import { countAdmins, isActiveAdmin, lockAdminRoster } from "./adminRoster";

export type UserWriteResult =
  | { ok: true }
  | { ok: false; reason: "forbidden" | "not-found" | Exclude<AccountBlock, null> };

/**
 * API-33 — promotes a User or demotes an Administrator (DEC-47). Never on oneself, never demoting the
 * last administrator; both are decided here, inside one transaction that holds the roster lock, so the
 * disabled button is presentation only (NFR-01). The caller is re-checked against the database: a
 * session whose owner was demoted or deleted since sign-in writes nothing. Setting the role the account
 * already has changes nothing. The only field written is `role`, taken from the argument.
 */
export async function changeUserRole(callerId: number, targetId: number, role: Role): Promise<UserWriteResult> {
  return db.$transaction(async (tx) => {
    await lockAdminRoster(tx);
    if (!(await isActiveAdmin(tx, callerId))) return { ok: false, reason: "forbidden" };
    if (targetId === callerId) return { ok: false, reason: "self" };
    const target = await tx.user.findUnique({ where: { id: targetId }, select: { id: true, role: true } });
    if (!target) return { ok: false, reason: "not-found" };
    if (target.role === role) return { ok: true };
    if (role === "USER") {
      const block = accountBlock(target, callerId, await countAdmins(tx));
      if (block) return { ok: false, reason: block };
    }
    await tx.user.update({ where: { id: targetId }, data: { role } });
    return { ok: true };
  });
}
