"use server";

import { revalidatePath } from "next/cache";
import { refuseNotFound, requireAdmin } from "@/server/permissions";
import { categoryNameSchema } from "@/server/services/categoryValidation";
import { renameCategory } from "@/server/services/renameCategory";
import { renameRequestOfBody } from "./categoryActionInput";

export type RenameCategoryActionResult = { ok: true } | { ok: false; fieldError: string };

/** API-28 — the inline rename. Administrator only; `id` never comes from anywhere but the body. */
export async function renameCategoryAction(raw: unknown): Promise<RenameCategoryActionResult> {
  await requireAdmin();
  const request = renameRequestOfBody(raw);
  if (!request) refuseNotFound();

  const parsedName = categoryNameSchema.safeParse(request.category_name);
  if (!parsedName.success) {
    return { ok: false, fieldError: parsedName.error.issues[0]?.message ?? "Nazwa jest nieprawidłowa" };
  }

  const result = await renameCategory(request.id, parsedName.data);
  if (!result.ok) {
    if (result.reason === "not-found") refuseNotFound();
    return { ok: false, fieldError: result.message };
  }

  revalidatePath("/", "layout");
  return { ok: true };
}
