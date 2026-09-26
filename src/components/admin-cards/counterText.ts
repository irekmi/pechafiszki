import { pluralPl } from "@/components/summary/pluralPl";
import type { AdminStatusCounts } from "@/server/services/adminListFlashcards";

/** SCR-18 element 2: "343 fiszki: 312 zatwierdzonych, 7 oczekujących, 24 odrzucone" — the whole pool, whatever the filters. */
export function counterText({ approved, pending, rejected }: AdminStatusCounts): string {
  const total = approved + pending + rejected;
  return [
    `${total} ${pluralPl(total, "fiszka", "fiszki", "fiszek")}: `,
    `${approved} ${pluralPl(approved, "zatwierdzona", "zatwierdzone", "zatwierdzonych")}, `,
    `${pending} ${pluralPl(pending, "oczekująca", "oczekujące", "oczekujących")}, `,
    `${rejected} ${pluralPl(rejected, "odrzucona", "odrzucone", "odrzuconych")}`,
  ].join("");
}
