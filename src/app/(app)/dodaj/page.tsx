import type { Metadata } from "next";
import { SubmitScreen } from "@/components/submit/SubmitScreen";
import { requireUser } from "@/server/permissions";
import { listCategories } from "@/server/services/listCategories";

export const metadata: Metadata = { title: "Dodaj fiszkę — Fiszki na rozmowy rekrutacyjne" };

/**
 * SCR-10 — submit a flashcard (API-16). Any signed-in person, an Administrator included: the card is
 * created `PENDING` either way (SCR-10 Access). The session is re-checked here (CLAUDE.md §8); the
 * categories come from API-26.
 */
export default async function DodajPage() {
  await requireUser();
  const { rows } = await listCategories();
  return <SubmitScreen categories={rows} />;
}
