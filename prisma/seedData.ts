import { readFileSync } from "node:fs";
import { z } from "zod";

/**
 * The content of the seeded pool (REQ-03, DEC-21): the nine legacy categories and the 220 legacy
 * flashcards, extracted from index.html by prisma/extract-legacy-cards.mjs into seed-data.json.
 * Every value is checked against the DEC-27 limits here, before the seed writes anything.
 */

/** DEC-22 — descending card count; `position` is the index + 1. */
export const SEED_CATEGORIES = [
  "PHP",
  "Symfony",
  "Doctrine/SQL",
  "React",
  "Architektura",
  "API/HTTP",
  "TypeScript",
  "Testy",
  "Security",
] as const;

export const EXPECTED_CARD_COUNT = 220;

/** DEC-27 — question 200, answer 1200, code example 1200 characters; DEC-24 — category name 40. */
export const seedCardSchema = z.object({
  category: z.enum(SEED_CATEGORIES),
  question: z.string().trim().min(1).max(200),
  answer: z.string().trim().min(1).max(1200),
  codeExample: z.string().max(1200).nullable(),
});

export type SeedCard = z.infer<typeof seedCardSchema>;

const seedFileSchema = z.array(seedCardSchema);

/**
 * Reads and validates seed-data.json. Throws — loudly, before the first write — on a value that
 * breaks a DEC-27 limit, names an unknown category, or changes the expected card count.
 */
export function loadSeedCards(): SeedCard[] {
  const raw: unknown = JSON.parse(
    readFileSync(new URL("./seed-data.json", import.meta.url), "utf8"),
  );
  const cards = seedFileSchema.parse(raw);
  if (cards.length !== EXPECTED_CARD_COUNT) {
    throw new Error(`seed-data.json holds ${cards.length} flashcards, expected ${EXPECTED_CARD_COUNT}`);
  }
  return cards;
}
