import type { Metadata } from "next";
import { MyCardsScreen } from "@/components/my-cards/MyCardsScreen";
import { requireUser } from "@/server/permissions";
import { listMyFlashcards } from "@/server/services/listMyFlashcards";
import { parseMyCardsNotice, parseMyCardsStatus } from "@/server/services/myCardsParams";

export const metadata: Metadata = { title: "Moje fiszki — Fiszki na rozmowy rekrutacyjne" };

type SearchParams = Record<string, string | string[] | undefined>;

/**
 * SCR-11 — the signed-in person's own submissions (API-15). Any signed-in person, an Administrator
 * included, sees only their own cards: the id that scopes the query comes from the session, never
 * from the address. `status` is validated by Zod and falls back to "all", so a hand-made address
 * never reaches an error page.
 */
export default async function MojeFiszkiPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const user = await requireUser();
  const raw = await searchParams;
  const status = parseMyCardsStatus(raw);
  const { rows, counts } = await listMyFlashcards(user.id, status);
  return <MyCardsScreen rows={rows} counts={counts} status={status} submitted={parseMyCardsNotice(raw) !== undefined} />;
}
