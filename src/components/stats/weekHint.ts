const WARSAW = "Europe/Warsaw";

function dayMonth(date: Date): string {
  return date.toLocaleDateString("pl-PL", { timeZone: WARSAW, day: "2-digit", month: "2-digit" });
}

function dayMonthYear(date: Date): string {
  return date.toLocaleDateString("pl-PL", { timeZone: WARSAW, day: "2-digit", month: "2-digit", year: "numeric" });
}

/**
 * `13-moje-statystyki.html`'s weekly hint, generalised to any Monday–Sunday pair (DEC-06 guarantees
 * the week always starts on a Monday and ends on a Sunday, so those two words are never wrong) plus
 * the true previous week's count.
 */
export function formatStatsWeekHint(weekStart: Date, weekEnd: Date, previousWeek: number): string {
  return (
    `Fiszki, które pierwszy raz oceniłeś „Umiem” między poniedziałkiem ${dayMonth(weekStart)} ` +
    `a niedzielą ${dayMonthYear(weekEnd)}. W poprzednim tygodniu: ${previousWeek}.`
  );
}
