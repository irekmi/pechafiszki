"use server";

import { revalidatePath } from "next/cache";
import { refuseNotFound, requireAdmin } from "@/server/permissions";
import { deleteCategory } from "@/server/services/deleteCategory";
import { idRequestOfBody } from "./categoryActionInput";

export type DeleteCategoryActionResult = { ok: true } | { ok: false; note: string };

/** API-29 — **Usuń**, enforced here too, not only by the disabled button (NFR-01). */
export async function deleteCategoryAction(raw: unknown): Promise<DeleteCategoryActionResult> {
  await requireAdmin();
  const request = idRequestOfBody(raw);
  if (!request) refuseNotFound();

  const result = await deleteCategory(request.id);
  if (!result.ok) return { ok: false, note: result.message };

  revalidatePath("/", "layout");
  return { ok: true };
}
