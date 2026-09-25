/** `22 września 2026, 19:41` — the sub-line's start time, in the learner's calendar (Europe/Warsaw, DEC-06). */
export function formatStart(date: Date): string {
  const zone = { timeZone: "Europe/Warsaw" } as const;
  const day = date.toLocaleDateString("pl-PL", { ...zone, day: "numeric", month: "long", year: "numeric" });
  const time = date.toLocaleTimeString("pl-PL", { ...zone, hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
  return `${day}, ${time}`;
}
