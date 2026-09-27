import { z } from "zod";
import type { WeekOption } from "@/server/services/getStatistics";

type RawParams = Record<string, string | string[] | undefined>;

/** DEC-54: exactly `current` or `previous`; anything else falls back to `current` (AC-21.9). Nothing deeper is offered. */
export const weekSchema = z.enum(["current", "previous"]).catch("current");

function first(raw: RawParams, name: string): string | undefined {
  const value = raw[name];
  return Array.isArray(value) ? value[0] : value;
}

/** The URL search parameters of SCR-13 / API-09: only `?week=`. */
export function parseWeekParam(raw: RawParams): WeekOption {
  return weekSchema.parse(first(raw, "week"));
}
