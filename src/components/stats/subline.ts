import { pluralPl } from "@/components/summary/pluralPl";

/**
 * "N zatwierdzonych fiszek" — DEV-01's real pool count, correctly declined for `N` rather than the
 * mockup's fixed plural (ISS-11 is this same class of bug elsewhere; this sub-line does not repeat it).
 */
export function poolCountPhrase(total: number): string {
  const noun = pluralPl(total, "zatwierdzoną fiszkę", "zatwierdzone fiszki", "zatwierdzonych fiszek");
  return `${total} ${noun}`;
}
