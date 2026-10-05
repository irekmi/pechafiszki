import { db } from "@/server/db";
import { lockCategoryPositions } from "./categoryLock";
import { DUPLICATE_NAME, isDuplicateNameError, type CategoryRecord } from "./categoryValidation";

export type CreateCategoryResult = { ok: true; category: CategoryRecord } | { ok: false; message: string };

/**
 * API-27 — appends at `position = max + 1` (DEC-22 seeds the initial order; an administrator may
 * change it afterwards). The advisory lock keeps two concurrent creates from reading the same `max`;
 * a duplicate name (DEC-24) surfaces as the database's unique-index violation, not a pre-check.
 */
export async function createCategory(name: string): Promise<CreateCategoryResult> {
  try {
    const category = await db.$transaction(async (tx) => {
      await lockCategoryPositions(tx);
      const { _max } = await tx.category.aggregate({ _max: { position: true } });
      return tx.category.create({
        data: { name, position: (_max.position ?? 0) + 1 },
        select: { id: true, name: true, position: true },
      });
    });
    return { ok: true, category };
  } catch (error) {
    if (isDuplicateNameError(error)) return { ok: false, message: DUPLICATE_NAME };
    throw error;
  }
}
