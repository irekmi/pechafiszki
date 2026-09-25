const MONTHS = [
  "stycznia", "lutego", "marca", "kwietnia", "maja", "czerwca",
  "lipca", "sierpnia", "września", "października", "listopada", "grudnia",
];

/**
 * The wording of `05-start.html` / `13-moje-statystyki.html`'s weekly hint, generalised to any
 * Monday–Sunday pair (the mockup's own text is a fixed sample). Formatted in Europe/Warsaw, matching
 * `src/domain/week.ts`'s boundaries (DEC-02, DEC-06).
 */
export function formatWeekHint(start: Date, end: Date): string {
  const startParts = warsawDate(start);
  const endParts = warsawDate(end);
  const sameMonth = startParts.month === endParts.month && startParts.year === endParts.year;
  const from = sameMonth ? `${startParts.day}` : `${startParts.day} ${MONTHS[startParts.month]}`;
  const to = `${endParts.day} ${MONTHS[endParts.month]} ${endParts.year}`;
  return `Fiszki, które pierwszy raz oceniłeś „Umiem” między ${from} a ${to}.`;
}

function warsawDate(instant: Date): { day: number; month: number; year: number } {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Warsaw",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const map: Record<string, string> = {};
  for (const part of formatter.formatToParts(instant)) map[part.type] = part.value;
  return { day: Number(map.day), month: Number(map.month) - 1, year: Number(map.year) };
}
