import type { Metadata } from "next";
import { EditScreen } from "@/components/edit-card/EditScreen";
import { refuseNotFound, requireUser } from "@/server/permissions";
import { parseCardId } from "@/server/services/cardId";
import { getEditCard } from "@/server/services/getEditCard";
import { listCategories } from "@/server/services/listCategories";

export const metadata: Metadata = { title: "Edytuj fiszkę — Fiszki na rozmowy rekrutacyjne" };

/**
 * SCR-12 — edit a flashcard (API-07, API-26). The session is re-checked here: a Guest goes to SCR-01.
 * An author opens their own `PENDING` or `REJECTED` card, an administrator any card; a malformed id, a
 * missing card, somebody else's card and the author's own approved card all end in the same
 * `refuseNotFound()` — SCR-22's 404 variant, told apart by nothing (DEC-57, CLAUDE.md §8).
 */
export default async function EditFlashcardPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const id = parseCardId((await params).id);
  if (id === null) refuseNotFound();

  const edit = await getEditCard(user, id);
  if (!edit) refuseNotFound();

  const { rows } = await listCategories();
  return <EditScreen edit={edit} categories={rows} isAdmin={user.role === "ADMIN"} />;
}
