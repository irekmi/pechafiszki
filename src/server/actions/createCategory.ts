"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/server/permissions";
import { categoryNameSchema } from "@/server/services/categoryValidation";
import { createCategory } from "@/server/services/createCategory";
import { emptyAddCategoryState, type AddCategoryState } from "./categoryFormState";

/**
 * API-27 — **Dodaj kategorię**. Administrator only; the field read is exactly `new_category`, nothing
 * else from the form reaches the service.
 */
export async function createCategoryAction(_previous: AddCategoryState, formData: FormData): Promise<AddCategoryState> {
  await requireAdmin();

  const raw = formData.get("new_category");
  const value = typeof raw === "string" ? raw : "";
  const parsed = categoryNameSchema.safeParse(value);
  if (!parsed.success) {
    return { name: value, error: parsed.error.issues[0]?.message ?? "Nazwa jest nieprawidłowa" };
  }

  const result = await createCategory(parsed.data);
  if (!result.ok) return { name: parsed.data, error: result.message };

  revalidatePath("/", "layout");
  return { ...emptyAddCategoryState, addedId: result.category.id };
}
