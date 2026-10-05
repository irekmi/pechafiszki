import type { Prisma } from "@prisma/client";

type Tx = Prisma.TransactionClient;

/**
 * Serialises every write that touches `Category.position` — create, delete, reorder — the same
 * advisory-lock pattern `lockAdminRoster` uses for the administrator roster. Without it two
 * concurrent admins could compute the same `max` on create, or interleave a reorder's steps with a
 * delete's gap-closing.
 *
 * Raw SQL, on purpose (CLAUDE.md §2): Prisma has no advisory lock. The key is a constant, not input.
 */
export async function lockCategoryPositions(tx: Tx): Promise<void> {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('fiszki:category-positions'))`;
}
