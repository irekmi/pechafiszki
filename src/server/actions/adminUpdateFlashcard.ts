"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { refuseNotFound, requireAdmin } from "@/server/permissions";
import { QUEUE_PATH } from "@/server/services/adminQueueParams";
import { adminUpdateFlashcard } from "@/server/services/adminUpdateFlashcard";
import { cardIdOfForm } from "./editInput";
import type { EditState } from "./editFlashcardState";
import { CATEGORY_ERROR, formField, readFlashcardForm } from "./flashcardForm";

/**
 * API-22 — **Zapisz zmiany** and **Zapisz i zatwierdź** (`intent=approve`). `requireAdmin` runs before
 * anything is read, so a User or a Guest never reaches the service whatever the form carries. Approving
 * lands on SCR-16; a plain save answers with the moment it happened, for the toast (DEC-34).
 */
export async function adminUpdateFlashcardAction(_previous: EditState, formData: FormData): Promise<EditState> {
  const admin = await requireAdmin();
  const id = cardIdOfForm(formData);
  if (id === null) refuseNotFound();

  const form = readFlashcardForm(formData);
  if (!form.ok) return { errors: form.errors };

  const approve = formField(formData, "intent") === "approve";
  const result = await adminUpdateFlashcard(admin, id, form.data, approve);
  if (!result.ok) {
    if (result.reason === "already-approved") return { errors: {}, conflict: true };
    return result.reason === "category" ? { errors: CATEGORY_ERROR } : refuseNotFound();
  }
  revalidatePath("/", "layout");
  if (approve) redirect(QUEUE_PATH);
  return { errors: {}, saved: Date.now() };
}
