import { pluralPl } from "@/components/summary/pluralPl";
import type { Mark } from "@/domain/types";
import type { LibraryMark } from "@/server/services/listFlashcards";

const FRAGMENT_LENGTH = 40;

/** The third breadcrumb crumb: the question cut at a word boundary (SCR-09 element 1). */
export function questionFragment(question: string): string {
  const text = question.trim().replace(/\s+/g, " ");
  if (text.length <= FRAGMENT_LENGTH) return text;
  const cut = text.slice(0, FRAGMENT_LENGTH);
  const space = cut.lastIndexOf(" ");
  return `${(space > FRAGMENT_LENGTH / 2 ? cut.slice(0, space) : cut).trimEnd()}…`;
}

/** DEC-40: an author whose account was deleted reads "Usunięty użytkownik". */
export function authorName(author: string | null): string {
  return author ?? "Usunięty użytkownik";
}

/** "Oceniona „Umiem”" value: `0 razy`, `1 raz`, `2 razy`. */
export function knowTimes(count: number): string {
  return `${count} ${pluralPl(count, "raz", "razy", "razy")}`;
}

const LIBRARY_MARK: Record<Mark, LibraryMark> = { KNOW: "know", REPEAT: "repeat", UNKNOWN: "unknown" };

/** The badge key of a marking; a card never marked is "Nie zaczęte". */
export function libraryMark(mark: Mark | null): LibraryMark {
  return mark === null ? "new" : LIBRARY_MARK[mark];
}
