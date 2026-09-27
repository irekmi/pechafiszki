import { db } from "@/server/db";
import { lockCategoryPositions } from "./categoryLock";

const NOT_EMPTY = "Ta kategoria zawiera fiszki i nie można jej usunąć";

/** Large enough that no real `position` value ever falls inside it — see `deleteCategory` below. */
const GAP_OFFSET = 1_000_000;

export type DeleteCategoryResult = { ok: true } | { ok: false; message: string };

/**
 * API-29 — refuses while the category holds a flashcard in **any** status; ENT-02's `restrict`
 * relation is the database backstop behind this friendlier refusal (NFR-01). A row already gone is
 * treated as done, matching the endpoint's own idempotency note ("a second call finds nothing").
 *
 * On success the remaining positions close the gap in two offset `updateMany` calls rather than one
 * plain `position - 1`: a single batch decrement can still collide on the unique index mid-statement,
 * depending on the physical order Postgres visits the rows in, because an untouched row can
 * momentarily hold the value a shifted row is moving into. Shifting everything far into negative
 * territory first, then back up by one less than the offset, keeps every intermediate value disjoint
 * from every other row's value, whatever order the rows are processed in.
 */
export async function deleteCategory(id: number): Promise<DeleteCategoryResult> {
  return db.$transaction(async (tx) => {
    await lockCategoryPositions(tx);
    const category = await tx.category.findUnique({ where: { id }, select: { position: true } });
    if (!category) return { ok: true };
    const total = await tx.flashcard.count({ where: { categoryId: id } });
    if (total > 0) return { ok: false, message: NOT_EMPTY };

    await tx.category.delete({ where: { id } });
    await tx.category.updateMany({
      where: { position: { gt: category.position } },
      data: { position: { decrement: GAP_OFFSET } },
    });
    await tx.category.updateMany({
      where: { position: { lt: 0 } },
      data: { position: { increment: GAP_OFFSET - 1 } },
    });
    return { ok: true };
  });
}
