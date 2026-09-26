"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { refuseNotFound, requireUser } from "@/server/permissions";
import { deleteOwnFlashcard } from "@/server/services/deleteOwnFlashcard";
import { MY_CARDS_PATH } from "@/server/services/myCardsParams";
import { cardIdOfBody } from "./editInput";

/**
 * API-18 — the author withdraws their own undecided card, then lands on SCR-11. Another person's card
 * and an approved one are refused as SCR-22's 404, as is a second call (DEC-38).
 */
export async function deleteOwnFlashcardAction(raw: unknown): Promise<void> {
  const user = await requireUser();
  const id = cardIdOfBody(raw);
  if (id === null) refuseNotFound();
  if (!(await deleteOwnFlashcard(user, id)).ok) refuseNotFound();
  revalidatePath("/", "layout");
  redirect(MY_CARDS_PATH);
}
