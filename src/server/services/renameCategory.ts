import { db } from "@/server/db";
import { DUPLICATE_NAME, isDuplicateNameError, isMissingRowError, type CategoryRecord } from "./categoryValidation";

export type RenameCategoryResult =
  | { ok: true; category: CategoryRecord }
  | { ok: false; reason: "duplicate"; message: string }
  | { ok: false; reason: "not-found" };

/**
 * API-28 — renames in place. Flashcards reference the id, never the name, so renaming touches
 * nothing else (DEC-23). A duplicate (DEC-24, excluding this very row) is the database's unique-index
 * violation on `lower(name)` (DL-02); a row gone since the page loaded is `not-found`, not a crash.
 */
export async function renameCategory(id: number, name: string): Promise<RenameCategoryResult> {
  try {
    const category = await db.category.update({
      where: { id },
      data: { name },
      select: { id: true, name: true, position: true },
    });
    return { ok: true, category };
  } catch (error) {
    if (isDuplicateNameError(error)) return { ok: false, reason: "duplicate", message: DUPLICATE_NAME };
    if (isMissingRowError(error)) return { ok: false, reason: "not-found" };
    throw error;
  }
}
