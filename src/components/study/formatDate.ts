/** `18.09.2026` — the date format of the mockups, in the learner's calendar (Europe/Warsaw, DEC-06). */
export function formatDate(date: Date): string {
  return date.toLocaleDateString("pl-PL", {
    timeZone: "Europe/Warsaw",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
