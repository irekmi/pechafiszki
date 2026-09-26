"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { refuseNotFound, requireAdmin } from "@/server/permissions";
import { ADMIN_CARDS_PATH } from "@/server/services/adminCardsPath";
import { deleteFlashcard } from "@/server/services/deleteFlashcard";
import { cardIdOfBody } from "./editInput";

/**
 * API-23 — an administrator removes any card, cascading progress and events (DEC-37), then lands on
 * the administration list. A second call finds nothing and renders SCR-22.
 */
export async function deleteFlashcardAction(raw: unknown): Promise<void> {
  await requireAdmin();
  const id = cardIdOfBody(raw);
  if (id === null) refuseNotFound();
  if (!(await deleteFlashcard(id)).ok) refuseNotFound();
  revalidatePath("/", "layout");
  redirect(ADMIN_CARDS_PATH);
}
