"use server";

import { redirect } from "next/navigation";
import { refuseNotFound, requireUser } from "@/server/permissions";
import { MY_CARDS_PATH, SAVED_NOTICE } from "@/server/services/myCardsParams";
import { updateOwnFlashcard } from "@/server/services/updateOwnFlashcard";
import { cardIdOfForm } from "./editInput";
import type { EditState } from "./editFlashcardState";
import { CATEGORY_ERROR, readFlashcardForm } from "./flashcardForm";

/**
 * API-17 — **Zapisz i wyślij do zatwierdzenia**. The session first (a Guest goes to SCR-01); the
 * author, the status and the role are never read from the form — the service matches the caller's own
 * undecided row or writes nothing (NFR-01, DEC-30). An approval that got in first is the DEC-58
 * conflict; every other refusal is SCR-22's 404, the answer a missing card gets.
 */
export async function updateOwnFlashcardAction(_previous: EditState, formData: FormData): Promise<EditState> {
  const user = await requireUser();
  const id = cardIdOfForm(formData);
  if (id === null) refuseNotFound();

  const form = readFlashcardForm(formData);
  if (!form.ok) return { errors: form.errors };

  const result = await updateOwnFlashcard(user, id, form.data);
  if (result.ok) redirect(`${MY_CARDS_PATH}?zmiana=${SAVED_NOTICE}`);
  if (result.reason === "already-approved") return { errors: {}, conflict: true };
  if (result.reason === "category") return { errors: CATEGORY_ERROR };
  return refuseNotFound();
}
