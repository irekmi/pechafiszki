"use server";

import { revalidatePath } from "next/cache";
import { refuseNotFound, requireAdmin } from "@/server/permissions";
import { reorderCategory, type ReorderCategoryResult } from "@/server/services/reorderCategory";
import { reorderRequestOfBody } from "./categoryActionInput";

/** API-30 — **W górę** / **W dół**. A no-op at either end still answers `ok`, just `moved: false`. */
export async function reorderCategoryAction(raw: unknown): Promise<ReorderCategoryResult> {
  await requireAdmin();
  const request = reorderRequestOfBody(raw);
  if (!request) refuseNotFound();

  const result = await reorderCategory(request.id, request.direction);
  if (result.moved) revalidatePath("/", "layout");
  return result;
}
