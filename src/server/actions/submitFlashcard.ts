"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/server/permissions";
import { MY_CARDS_PATH, SUBMITTED_NOTICE } from "@/server/services/myCardsParams";
import { submitFlashcard } from "@/server/services/submitFlashcard";
import { CATEGORY_ERROR, readFlashcardForm } from "./flashcardForm";
import type { SubmitState } from "./submitFlashcardState";

/**
 * API-16 — submits a flashcard into the approval queue. The session is checked first (a Guest is
 * sent to SCR-01), and only the four documented fields are read (`readFlashcardForm`): the service
 * fixes `PENDING` and the author itself (NFR-01, AC-13.3).
 */
export async function submitFlashcardAction(_previous: SubmitState, formData: FormData): Promise<SubmitState> {
  const user = await requireUser();

  const form = readFlashcardForm(formData);
  if (!form.ok) return { errors: form.errors };

  const result = await submitFlashcard(user, form.data);
  if (!result.ok) {
    return result.reason === "no-categories" ? { errors: {}, noCategories: true } : { errors: CATEGORY_ERROR };
  }
  redirect(`${MY_CARDS_PATH}?zmiana=${SUBMITTED_NOTICE}`);
}
