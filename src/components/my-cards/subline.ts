import { pluralPl } from "@/components/summary/pluralPl";
import type { MyCardsCounts } from "@/server/services/listMyFlashcards";

/**
 * SCR-11 element 2 — "22 zgłoszenia · 3 oczekują na decyzję administratora". The pending part is
 * left out when nothing waits; the verb follows the count ("1 oczekuje", "3 oczekują", "5 oczekuje").
 */
export function myCardsSubline({ all, pending }: Pick<MyCardsCounts, "all" | "pending">): string {
  const total = `${all} ${pluralPl(all, "zgłoszenie", "zgłoszenia", "zgłoszeń")}`;
  if (pending === 0) return total;
  return `${total} · ${pending} ${pluralPl(pending, "oczekuje", "oczekują", "oczekuje")} na decyzję administratora`;
}
