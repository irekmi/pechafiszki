import type { Prisma } from "@prisma/client";
import { z } from "zod";
import type { Mark, QueueEntry } from "@/domain/types";

/**
 * The shape of `ENT-07.filters` and of API-10's request body: a category id, a marking and a search
 * phrase, each optional. Stored as JSON, replayed by **Ucz się dalej** (ST-09), read back by SCR-06.
 */
export const sessionFiltersSchema = z.object({
  category: z.number().int().positive().optional(),
  mark: z.enum(["know", "repeat", "unknown"]).optional(),
  query: z.string().max(100).optional(),
});

export type SessionFilters = z.infer<typeof sessionFiltersSchema>;

export const MARK_OF_FILTER: Record<NonNullable<SessionFilters["mark"]>, Mark> = {
  know: "KNOW",
  repeat: "REPEAT",
  unknown: "UNKNOWN",
};

/** Whitespace-only search text is no search; the stored form never carries an empty key. */
export function normaliseFilters(filters: SessionFilters): SessionFilters {
  const query = filters.query?.trim();
  return {
    ...(filters.category ? { category: filters.category } : {}),
    ...(filters.mark ? { mark: filters.mark } : {}),
    ...(query ? { query } : {}),
  };
}

/** A stored `filters` column that no longer parses is treated as "no filters", never as an error. */
export function parseStoredFilters(json: unknown): SessionFilters {
  const parsed = sessionFiltersSchema.safeParse(json);
  return parsed.success ? normaliseFilters(parsed.data) : {};
}

const queueSchema = z.array(z.object({ flashcardId: z.number().int(), isReinforcement: z.boolean() }));

/** `ENT-07.queue`: ordered flashcard ids with the reinforcement positions flagged. */
export function parseStoredQueue(json: unknown): QueueEntry[] {
  const parsed = queueSchema.safeParse(json);
  return parsed.success ? parsed.data : [];
}

export function queueToJson(queue: readonly QueueEntry[]): Prisma.InputJsonValue {
  return queue.map((entry) => ({
    flashcardId: entry.flashcardId,
    isReinforcement: entry.isReinforcement,
  }));
}

export function filtersToJson(filters: SessionFilters): Prisma.InputJsonValue {
  return { ...normaliseFilters(filters) };
}
