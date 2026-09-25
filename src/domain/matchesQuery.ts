/**
 * Folds text for searching — DEC-49: case-insensitive and diacritic-insensitive, so "domkniecie"
 * finds "domknięcie". `ł` has no Unicode decomposition, so it is folded by hand.
 */
export function foldText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/ł/g, "l");
}

/**
 * Whether a query matches a card — DEC-49. Substring matching over the given fields (question and
 * answer, never the code example), no ranking. A blank query matches everything.
 */
export function matchesQuery(fields: readonly string[], query: string): boolean {
  const needle = foldText(query.trim());
  if (needle === "") return true;
  return fields.some((field) => foldText(field).includes(needle));
}
