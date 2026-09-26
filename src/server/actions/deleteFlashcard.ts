"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { refuseNotFound, requireAdmin } from "@/server/permissions";
import { ADMIN_CARDS_PATH } from "@/server/services/adminCardsPath";
import { deleteFlashcard } from "@/server/services/deleteFlashcard";
import { deleteRequestOfBody } from "./editInput";

/**
 * API-23 — an administrator removes any card, cascading progress and events (DEC-37). From SCR-09 and
 * SCR-12 the caller lands on SCR-18; from SCR-18's row (`stay`) the list refreshes where it is, with its
 * filters, and the caller toasts. A second call finds nothing and renders SCR-22.
 */
export async function deleteFlashcardAction(raw: unknown): Promise<{ ok: true } | void> {
  await requireAdmin();
  const request = deleteRequestOfBody(raw);
  if (request === null) refuseNotFound();
  if (!(await deleteFlashcard(request.id)).ok) refuseNotFound();
  revalidatePath("/", "layout");
  if (request.stay) return { ok: true };
  redirect(ADMIN_CARDS_PATH);
}
