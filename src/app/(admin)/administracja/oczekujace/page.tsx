import type { Metadata } from "next";
import { QueueScreen } from "@/components/admin-queue/QueueScreen";
import { requireAdmin } from "@/server/permissions";
import { parseQueueParams } from "@/server/services/adminQueueParams";
import { listCategories } from "@/server/services/listCategories";
import { listPendingFlashcards } from "@/server/services/listPendingFlashcards";

export const metadata: Metadata = {
  title: "Administracja — fiszki oczekujące — Fiszki na rozmowy rekrutacyjne",
};

type SearchParams = Record<string, string | string[] | undefined>;

/**
 * SCR-16 — the approval queue (API-19). Administrator only, re-checked here as well as in the layout
 * (CLAUDE.md §8). `tab`, `category` and `sort` are validated by Zod and fall back to their defaults,
 * so a hand-made address never reaches an error page.
 */
export default async function OczekujacePage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await requireAdmin();
  const params = parseQueueParams(await searchParams);
  const [queue, { rows: categories }] = await Promise.all([listPendingFlashcards(params), listCategories()]);
  return <QueueScreen queue={queue} params={params} categories={categories} />;
}
