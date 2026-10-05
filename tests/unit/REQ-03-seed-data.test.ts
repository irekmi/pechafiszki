import { describe, expect, it } from "vitest";
import {
  EXPECTED_CARD_COUNT,
  SEED_CATEGORIES,
  loadSeedCards,
  seedCardSchema,
} from "../../prisma/seedData";

// REQ-03, DEC-21, DEC-22, DEC-27 — the content carried over from the retired legacy PWA, checked
// without a database: the counts, the nine categories, and the limits that stop the seed.

describe("seed data (REQ-03)", () => {
  const cards = loadSeedCards();

  it("holds the 220 legacy flashcards (DEC-21)", () => {
    expect(cards).toHaveLength(EXPECTED_CARD_COUNT);
  });

  it("uses only the nine categories, in the DEC-22 order", () => {
    expect(SEED_CATEGORIES).toEqual([
      "PHP",
      "Symfony",
      "Doctrine/SQL",
      "React",
      "Architektura",
      "API/HTTP",
      "TypeScript",
      "Testy",
      "Security",
    ]);
    expect(new Set(cards.map((card) => card.category)).size).toBe(SEED_CATEGORIES.length);
  });

  it("distributes the cards as DEC-22 counts them", () => {
    const perCategory = Object.fromEntries(
      SEED_CATEGORIES.map((name) => [name, cards.filter((card) => card.category === name).length]),
    );
    expect(perCategory).toEqual({
      PHP: 35,
      Symfony: 35,
      "Doctrine/SQL": 30,
      React: 30,
      Architektura: 25,
      "API/HTTP": 20,
      TypeScript: 20,
      Testy: 13,
      Security: 12,
    });
  });

  it("asks no question twice, so the seed can skip what it already wrote", () => {
    expect(new Set(cards.map((card) => card.question)).size).toBe(EXPECTED_CARD_COUNT);
  });

  it("keeps every value inside the DEC-27 limits", () => {
    for (const card of cards) {
      expect(card.question.length).toBeGreaterThan(0);
      expect(card.question.length).toBeLessThanOrEqual(200);
      expect(card.answer.length).toBeLessThanOrEqual(1200);
      expect(card.codeExample?.length ?? 0).toBeLessThanOrEqual(1200);
    }
  });

  it("rejects a 201-character question rather than truncating it (DEC-27)", () => {
    const tooLong = {
      category: "PHP",
      question: "a".repeat(201),
      answer: "Odpowiedź.",
      codeExample: null,
    };
    expect(seedCardSchema.safeParse(tooLong).success).toBe(false);
    expect(seedCardSchema.safeParse({ ...tooLong, question: "a".repeat(200) }).success).toBe(true);
  });

  it("rejects an over-long answer, an over-long code example and an unknown category", () => {
    const card = { category: "PHP", question: "Pytanie?", answer: "Odpowiedź.", codeExample: null };
    expect(seedCardSchema.safeParse({ ...card, answer: "a".repeat(1201) }).success).toBe(false);
    expect(seedCardSchema.safeParse({ ...card, codeExample: "a".repeat(1201) }).success).toBe(false);
    expect(seedCardSchema.safeParse({ ...card, category: "JavaScript" }).success).toBe(false);
    expect(seedCardSchema.safeParse({ ...card, answer: "" }).success).toBe(false);
  });
});
