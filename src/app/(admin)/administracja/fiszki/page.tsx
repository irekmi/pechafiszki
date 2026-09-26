import type { Metadata } from "next";
import { AdminCardsScreen } from "@/components/admin-cards/AdminCardsScreen";
import { requireAdmin } from "@/server/permissions";
import { parseAdminCardsParams } from "@/server/services/adminCardsParams";
import { adminListFlashcards } from "@/server/services/adminListFlashcards";
import { listCategories } from "@/server/services/listCategories";

export const metadata: Metadata = {
  title: "Administracja — wszystkie fiszki — Fiszki na rozmowy rekrutacyjne",
};

type SearchParams = Record<string, string | string[] | undefined>;

/**
 * SCR-18 — every flashcard in every status (API-24). Administrator only, re-checked here as well as in
 * the layout (CLAUDE.md §8): a Guest is redirected, a User gets SCR-22's 403 variant. The search
 * parameters are validated by Zod and fall back to their defaults (DEC-51), so a hand-made address
 * never reaches an error page.
 */
export default async function AdminCardsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await requireAdmin();
  const params = parseAdminCardsParams(await searchParams);
  const [page, { rows: categories }] = await Promise.all([adminListFlashcards(params), listCategories()]);
  return <AdminCardsScreen page={page} params={params} categories={categories} />;
}
