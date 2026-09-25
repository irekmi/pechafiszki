/** Polish plural: 1 → `one`, 2–4 (but not 12–14) → `few`, everything else → `many`. */
export function pluralPl(count: number, one: string, few: string, many: string): string {
  if (count === 1) return one;
  const lastTwo = count % 100;
  const last = count % 10;
  return last >= 2 && last <= 4 && !(lastTwo >= 12 && lastTwo <= 14) ? few : many;
}
