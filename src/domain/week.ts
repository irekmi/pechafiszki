import type { WeekBounds } from "./types";

const WARSAW_TZ = "Europe/Warsaw";
const WEEKDAY_NUMBER: Record<string, number> = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 };

interface WarsawParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  weekday: number;
}

function warsawParts(instant: Date): WarsawParts {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: WARSAW_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
    weekday: "short",
  });
  const map: Record<string, string> = {};
  for (const part of formatter.formatToParts(instant)) map[part.type] = part.value;
  return {
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
    hour: Number(map.hour),
    minute: Number(map.minute),
    second: Number(map.second),
    weekday: WEEKDAY_NUMBER[map.weekday!]!,
  };
}

/** The UTC instant at which Warsaw's wall clock reads the given calendar date and time. */
function warsawWallTimeToUtc(year: number, month: number, day: number, hour: number, minute: number, second: number): Date {
  const utcGuess = Date.UTC(year, month - 1, day, hour, minute, second);
  const observed = warsawParts(new Date(utcGuess));
  const observedAsUtc = Date.UTC(observed.year, observed.month - 1, observed.day, observed.hour, observed.minute, observed.second);
  return new Date(utcGuess - (observedAsUtc - utcGuess));
}

/**
 * Monday 00:00 to Sunday 23:59:59.999, Europe/Warsaw, as UTC instants — DEC-02, DEC-06.
 *
 * Both boundaries are computed with `Intl.DateTimeFormat`'s IANA rules, so a week that straddles a
 * daylight-saving change still starts and ends at the right UTC instant. Poland's transitions land
 * at 2–3 a.m. on a Sunday, never at a week boundary, so neither instant here is ever ambiguous.
 */
export function weekBounds(instant: Date): WeekBounds {
  const wall = warsawParts(instant);
  const daysSinceMonday = wall.weekday - 1;
  const monday = new Date(Date.UTC(wall.year, wall.month - 1, wall.day - daysSinceMonday));
  const sunday = new Date(Date.UTC(wall.year, wall.month - 1, wall.day - daysSinceMonday + 6));
  const start = warsawWallTimeToUtc(monday.getUTCFullYear(), monday.getUTCMonth() + 1, monday.getUTCDate(), 0, 0, 0);
  const endOfSecond = warsawWallTimeToUtc(sunday.getUTCFullYear(), sunday.getUTCMonth() + 1, sunday.getUTCDate(), 23, 59, 59);
  return { start, end: new Date(endOfSecond.getTime() + 999) };
}

/**
 * How many of these first-ever-Umiem instants fall in the Monday–Sunday week of `instant` —
 * DEC-02: a card counts in the week it was marked **Umiem** for the first time ever, and never
 * again in a later week.
 */
export function countMemorisedInWeek(firstKnownAtValues: readonly (Date | null)[], instant: Date): number {
  const { start, end } = weekBounds(instant);
  return firstKnownAtValues.filter(
    (value) => value !== null && value.getTime() >= start.getTime() && value.getTime() <= end.getTime(),
  ).length;
}
