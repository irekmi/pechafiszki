import { db } from "@/server/db";
import { lockCategoryPositions } from "./categoryLock";

export type Direction = "up" | "down";
export type ReorderCategoryResult = { ok: true; moved: boolean };

/**
 * API-30 — swaps `position` with the neighbour in display order; a no-op at either end (AC-19.6),
 * found by index in the `position`-ordered list rather than by arithmetic on the value itself.
 *
 * The swap goes through a negative sentinel (three updates) instead of two direct ones: writing the
 * neighbour's value straight into the current row would collide with the neighbour's own still-unread
 * row on the unique index, since it has not moved yet. Moving the current row out of the way first —
 * to a value no other row can ever hold — avoids that without a schema change (`position` stays a
 * plain unique column, no deferred constraint).
 */
export async function reorderCategory(id: number, direction: Direction): Promise<ReorderCategoryResult> {
  return db.$transaction(async (tx) => {
    await lockCategoryPositions(tx);
    const rows = await tx.category.findMany({ orderBy: { position: "asc" }, select: { id: true, position: true } });
    const index = rows.findIndex((row) => row.id === id);
    if (index === -1) return { ok: true, moved: false };
    const neighbourIndex = direction === "up" ? index - 1 : index + 1;
    if (neighbourIndex < 0 || neighbourIndex >= rows.length) return { ok: true, moved: false };

    const current = rows[index];
    const neighbour = rows[neighbourIndex];
    if (!current || !neighbour) return { ok: true, moved: false }; // unreachable: both indexes are in bounds
    await tx.category.update({ where: { id: current.id }, data: { position: -current.position } });
    await tx.category.update({ where: { id: neighbour.id }, data: { position: current.position } });
    await tx.category.update({ where: { id: current.id }, data: { position: neighbour.position } });
    return { ok: true, moved: true };
  });
}
