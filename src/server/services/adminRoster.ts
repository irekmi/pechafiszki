import type { Prisma } from "@prisma/client";

type Tx = Prisma.TransactionClient;

/**
 * Serialises every write that can change who is an administrator (role change, deletion). Without it
 * two administrators demoting each other both read "two administrators" and both commit, leaving none
 * (DEC-47). The lock is held until the transaction ends; the count that follows is a new statement, so
 * it sees whatever the previous holder committed.
 *
 * Raw SQL, on purpose (CLAUDE.md §2): Prisma has no advisory lock. The key is a constant, not input.
 * `$executeRaw` rather than `$queryRaw` because the function returns `void`, which the client cannot read.
 */
export async function lockAdminRoster(tx: Tx): Promise<void> {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('fiszki:admin-roster'))`;
}

/** Administrators in the whole system. Call after `lockAdminRoster`. */
export const countAdmins = (tx: Tx): Promise<number> => tx.user.count({ where: { role: "ADMIN" } });

/** Whether the caller still exists and is an administrator *in the database*, not merely in a session token. */
export async function isActiveAdmin(tx: Tx, id: number): Promise<boolean> {
  return (await tx.user.count({ where: { id, role: "ADMIN" } })) === 1;
}
